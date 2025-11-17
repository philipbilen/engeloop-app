"use client"

import { useState, useMemo, useTransition, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Database } from "@/lib/supabase/types"
import { updateTrackShares } from "@/lib/actions/shares"
import { useRouter } from "next/navigation"

type Track = Database["public"]["Tables"]["tracks"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]
type Share = Awaited<ReturnType<typeof import("@/lib/actions/shares").getSharesByTrack>>[0]
type ShareInsert = Database["public"]["Tables"]["licensor_shares"]["Insert"]

// Helper to calculate effective rate
const calculateEffectiveRate = (sharePercent: number, licensorPoolPercent: number) => {
  return (sharePercent / 100) * licensorPoolPercent
}

// Helper for splitting evenly
const splitEvenly = (count: number) => {
  if (count === 0) return []
  const base = Math.floor(10000 / count) / 100
  const remainder = 100 - base * count
  const results = Array(count).fill(base)
  for (let i = 0; i < Math.round(remainder * 100); i++) {
    results[i] = Math.round((results[i] + 0.01) * 100) / 100
  }
  return results
}

interface SplitsManagementModalProps {
  isOpen: boolean
  onClose: () => void
  track: Track
  initialShares: Share[]
  allContacts: Contact[]
  licensorPoolPercent: number
}

export function SplitsManagementModal({
  isOpen,
  onClose,
  track,
  initialShares,
  allContacts,
  licensorPoolPercent,
}: SplitsManagementModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [shares, setShares] = useState<Partial<Share>[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setShares(initialShares)
  }, [initialShares])

  const totalAllocated = useMemo(() => {
    return shares.reduce((sum, share) => sum + Number(share.share_percent || 0), 0)
  }, [shares])

  const isComplete = Math.round(totalAllocated * 100) === 10000

  const handleShareChange = (index: number, newPercent: string) => {
    const newShares = [...shares]
    newShares[index].share_percent = newPercent
    setShares(newShares)
  }

  const handleAddShare = (contactId: string) => {
    if (shares.some(s => s.contact_id === contactId)) return
    const contact = allContacts.find(c => c.id === contactId)
    if (!contact) return
    
    setShares([...shares, {
      contact_id: contact.id,
      share_percent: "0.00",
      role_context: 'Main Artist', // Default role, can be refined
      contacts: contact
    }])
  }

  const handleRemoveShare = (index: number) => {
    const newShares = shares.filter((_, i) => i !== index)
    setShares(newShares)
  }

  const handleSplitEvenly = () => {
    const evenShares = splitEvenly(shares.length)
    const newShares = shares.map((share, index) => ({
      ...share,
      share_percent: evenShares[index].toFixed(2)
    }))
    setShares(newShares)
  }

  const handleSave = () => {
    setError(null)
    if (!isComplete) {
      setError(`Total allocation must be exactly 100%. Current is ${totalAllocated.toFixed(2)}%.`)
      return
    }

    const sharesToInsert: ShareInsert[] = shares.map(s => ({
      track_id: track.id,
      contact_id: s.contact_id!,
      share_percent: Number(s.share_percent!),
      role_context: s.role_context!,
    }))

    startTransition(async () => {
      await updateTrackShares(track.id, sharesToInsert)
      router.refresh()
      onClose()
    })
  }

  const availableContacts = allContacts.filter(c => !shares.some(s => s.contact_id === c.id))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Allocate Licensor Pool for "${track.title}"`} size="xl">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="p-4 rounded" style={{ backgroundColor: 'var(--bg-interactive)', border: '2px solid var(--border-primary)'}}>
          <div className="flex justify-between items-center">
            <span className="font-semibold" style={{ color: 'var(--text-dim)' }}>Licensor Pool to Allocate</span>
            <span className="font-semibold text-lg" style={{ color: 'var(--accent-primary)' }}>{licensorPoolPercent}%</span>
          </div>
          <div className="mt-3">
            <div className="w-full h-3 rounded" style={{ backgroundColor: 'var(--bg-main)' }}>
              <div
                className="h-3 rounded transition-all"
                style={{
                  width: `${Math.min(totalAllocated, 100)}%`,
                  backgroundColor: totalAllocated > 100 ? 'var(--accent-danger)' : (isComplete ? 'var(--accent-success)' : 'var(--accent-primary)'),
                }}
              />
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-sm" style={{ color: 'var(--text-dimmer)' }}>Total Allocated</span>
              <span className={`text-sm font-semibold`} style={{ color: totalAllocated > 100 ? 'var(--accent-danger)' : 'var(--text-bright)' }}>
                {totalAllocated.toFixed(2)}% / 100%
              </span>
            </div>
          </div>
        </div>

        {/* Shares List */}
        <div className="space-y-3">
          {shares.map((share, index) => (
            <div key={index} className="grid grid-cols-12 gap-4 items-center">
              <div className="col-span-5 font-semibold" style={{ color: 'var(--text-bright)' }}>{share.contacts?.full_legal_name}</div>
              <div className="col-span-3">
                <Input
                  type="number"
                  value={share.share_percent}
                  onChange={e => handleShareChange(index, e.target.value)}
                  placeholder="0.00"
                  className="text-right font-mono"
                />
              </div>
              <div className="col-span-3 text-sm text-center" style={{ color: 'var(--text-dim)' }}>
                Effective: {calculateEffectiveRate(Number(share.share_percent || 0), licensorPoolPercent).toFixed(2)}%
              </div>
              <div className="col-span-1 text-right">
                <Button variant="icon" size="icon" onClick={() => handleRemoveShare(index)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Add & Actions */}
        <div className="pt-4 flex justify-between items-center" style={{ borderTop: '2px solid var(--border-primary)'}}>
          <div className="flex gap-2">
            <Select onChange={e => handleAddShare(e.target.value)} value="">
              <option value="" disabled>+ Add Licensor</option>
              {availableContacts.map(c => <option key={c.id} value={c.id}>{c.full_legal_name}</option>)}
            </Select>
          </div>
          <Button variant="secondary" onClick={handleSplitEvenly} disabled={shares.length === 0}>Split Evenly</Button>
        </div>
        {error && <p className="text-sm text-center" style={{ color: 'var(--accent-danger)' }}>{error}</p>}
      </div>

      {/* Footer */}
      <div className="p-4 flex justify-end gap-2" style={{ backgroundColor: 'var(--bg-interactive)', borderTop: '2px solid var(--border-primary)'}}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={isPending || !isComplete}>
          {isPending ? 'Saving...' : 'Save & Close'}
        </Button>
      </div>
    </Modal>
  )
}
