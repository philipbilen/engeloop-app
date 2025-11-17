"use client"

import { useState, useMemo } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { Select } from "@/components/ui/select" // Removed unused import
import { createAgreement } from "@/lib/actions/agreements"
import { Database } from "@/lib/supabase/types"
import { Tooltip } from "@/components/ui/tooltip"

type Agreement = Database["public"]["Tables"]["contracts"]["Row"]
type Contact = Database["public"]["Tables"]["contacts"]["Row"]

const InfoIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1" style={{ color: 'var(--text-muted)'}}><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
)

interface ReleaseScheduleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (agreement: Agreement) => void
  schedule?: Agreement | null
  allContacts: Contact[]
}

export function ReleaseScheduleFormModal({
  isOpen,
  onClose,
  onSuccess,
  schedule,
  allContacts,
}: ReleaseScheduleFormModalProps) {
  const [formData, setFormData] = useState({
    label_share_percent: schedule?.label_share_percent?.toString() || "50",
    licensor_pool_percent: schedule?.licensor_pool_percent?.toString() || "50",
    term: "Perpetual",
    territory: schedule?.territory || "World",
    advance: "0",
    recoupable_costs: "0",
    publishing: "No Engeloop Publishing",
  })
  const [signatories, setSignatories] = useState<Contact[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filteredContacts = useMemo(() => {
    if (!searchTerm) return []
    return allContacts.filter(
      (contact) =>
        contact.full_legal_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !signatories.some((s) => s.id === contact.id)
    )
  }, [searchTerm, allContacts, signatories])

  const addSignatory = (contact: Contact) => {
    setSignatories([...signatories, contact])
    setSearchTerm("")
  }

  const removeSignatory = (contactId: string) => {
    setSignatories(signatories.filter((s) => s.id !== contactId))
  }

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === "label_share_percent") {
        const labelShare = parseFloat(value) || 0
        updated.licensor_pool_percent = (100 - labelShare).toString()
      } else if (field === "licensor_pool_percent") {
        const licensorShare = parseFloat(value) || 0
        updated.label_share_percent = (100 - licensorShare).toString()
      }
      return updated
    })
  }

  const validateForm = (): string | null => {
    if (signatories.length === 0) return "At least one signatory is required"
    const labelShare = parseFloat(formData.label_share_percent)
    const licensorShare = parseFloat(formData.licensor_pool_percent)
    if (isNaN(labelShare) || isNaN(licensorShare)) return "Share percentages must be valid numbers"
    if (labelShare + licensorShare !== 100) return "Label and licensor shares must sum to 100%"
    if (labelShare < 0 || labelShare > 100 || licensorShare < 0 || licensorShare > 100) return "Share percentages must be between 0 and 100"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }
    setIsSubmitting(true)
    try {
      const scheduleData = {
        label_share_percent: parseFloat(formData.label_share_percent),
        licensor_pool_percent: parseFloat(formData.licensor_pool_percent),
        territory: formData.territory,
        signatoryIds: signatories.map(s => s.id)
      }
      if (schedule) {
        // TODO: Implement update logic
      } else {
        const result = await createAgreement(scheduleData)
        if (result.agreement) {
          onSuccess(result.agreement)
        }
      }
      onClose()
    } catch (error) {
      console.error("Failed to save release schedule:", error)
      setError("Failed to save release schedule. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={schedule ? "Edit Release Schedule" : "New Release Schedule"} size="lg">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3" style={{ border: "2px solid var(--accent-danger)", backgroundColor: "rgba(191, 97, 106, 0.15)", color: "var(--accent-danger)" }}>
              {error}
            </div>
          )}

          {/* Deal Terms Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>Deal Terms</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="schedule-label-share">Label Share %</Label>
                <Input id="schedule-label-share" type="number" step="0.01" min="0" max="100" value={formData.label_share_percent} onChange={(e) => handleChange("label_share_percent", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="schedule-licensor-pool" className="flex items-center">
                  Licensor Pool %
                  <Tooltip text="The total percentage of revenue allocated to all licensors (artists, producers, etc.) combined. This pool will be split among licensors in the Financials tab.">
                    <InfoIcon />
                  </Tooltip>
                </Label>
                <Input id="schedule-licensor-pool" type="number" step="0.01" min="0" max="100" value={formData.licensor_pool_percent} onChange={(e) => handleChange("licensor_pool_percent", e.target.value)} required />
              </div>
              <div>
                <Label htmlFor="schedule-term">Term</Label>
                <Input id="schedule-term" value={formData.term} onChange={(e) => handleChange("term", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="schedule-territory">Territory</Label>
                <Input id="schedule-territory" value={formData.territory} onChange={(e) => handleChange("territory", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="schedule-advance" className="flex items-center">
                  Advance
                  <Tooltip text="Any upfront payment made to licensors. This amount is typically recouped from their royalties.">
                    <InfoIcon />
                  </Tooltip>
                </Label>
                <Input id="schedule-advance" type="number" value={formData.advance} onChange={(e) => handleChange("advance", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="schedule-recoupable-costs" className="flex items-center">
                  Recoupable Costs
                  <Tooltip text="Expenses (e.g., marketing, video production) that the label can recoup from the licensors' share of revenue.">
                    <InfoIcon />
                  </Tooltip>
                </Label>
                <Input id="schedule-recoupable-costs" type="number" value={formData.recoupable_costs} onChange={(e) => handleChange("recoupable_costs", e.target.value)} />
              </div>
            </div>
          </div>

          {/* Signatories Section */}
          <div className="space-y-4 pt-6" style={{ borderTop: '2px solid var(--border-primary)'}}>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>Signatories</h3>
            <div>
              <Label>Licensor Contacts <span style={{ color: "var(--accent-danger)" }}>*</span></Label>
              <div className="p-2 mt-1 space-y-2" style={{ border: '2px solid var(--border-primary)' }}>
                {signatories.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-2" style={{ backgroundColor: 'var(--bg-secondary)'}}>
                    <span>{contact.full_legal_name}</span>
                    <Button type="button" variant="danger" size="sm" onClick={() => removeSignatory(contact.id)}>Remove</Button>
                  </div>
                ))}
                <div className="relative">
                  <Input type="text" placeholder="Search for a contact to add as signatory..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  {filteredContacts.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 p-2 space-y-1" style={{ border: '2px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)'}}>
                      {filteredContacts.slice(0, 5).map(contact => (
                        <div key={contact.id} className="p-2 cursor-pointer hover:bg-tertiary" onClick={() => addSignatory(contact)}>
                          {contact.full_legal_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="p-4 flex gap-2 justify-end" style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '2px solid var(--border-primary)'}}>
          <Button type="button" variant="ghost" onClick={handleCancel} disabled={isSubmitting}>CANCEL</Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>{isSubmitting ? "SAVING..." : schedule ? "UPDATE SCHEDULE" : "CREATE SCHEDULE"}</Button>
        </div>
      </form>
    </Modal>
  )
}