"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { StatusBadge } from "@/components/ui/badge"
import { ContactPicker } from "./contact-picker"
// If not, we might need to pass a server action or use a standard fetch. 
// For now, I'll assume we pass data in and might need to implement save logic.

interface ContractDetailProps {
    contract: any // Typed as any for now to match page.tsx
    contacts: any[]
}

export function ContractDetailView({ contract: initialContract, contacts }: ContractDetailProps) {
    const router = useRouter()
    const [contract, setContract] = useState(initialContract)
    const [isSaving, setIsSaving] = useState(false)

    // Derived state
    // Ensure we always have at least one signatory slot, even if empty
    const signatories = contract.contract_signatories && contract.contract_signatories.length > 0
        ? contract.contract_signatories
        : [{ contact_id: "" }]

    const handleLicensorChange = (index: number, contactId: string) => {
        const newSignatories = [...(contract.contract_signatories || [])]

        // Ensure array is large enough (should be covered by rendering logic, but safety check)
        if (!newSignatories[index]) {
            newSignatories[index] = { contact_id: "" }
        }

        newSignatories[index] = { ...newSignatories[index], contact_id: contactId }
        setContract({ ...contract, contract_signatories: newSignatories })
    }

    const handleAddLicensor = () => {
        const newSignatories = [...(contract.contract_signatories || [])]
        newSignatories.push({ contact_id: "" })
        setContract({ ...contract, contract_signatories: newSignatories })
    }

    const handleRemoveLicensor = (index: number) => {
        const newSignatories = [...(contract.contract_signatories || [])]
        newSignatories.splice(index, 1)

        // If we removed the last one, add an empty one back so there's always at least one input
        if (newSignatories.length === 0) {
            newSignatories.push({ contact_id: "" })
        }

        setContract({ ...contract, contract_signatories: newSignatories })
    }

    const handleSave = async () => {
        setIsSaving(true)
        // Simulate save
        await new Promise(resolve => setTimeout(resolve, 1000))
        setIsSaving(false)
        router.refresh()
    }

    return (
        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-[var(--text-bright)] tracking-tight">
                            {contract.contract_type}
                        </h1>
                        <StatusBadge status={contract.status} />
                    </div>
                    <p className="text-[var(--text-dim)] font-mono text-sm">
                        ID: {contract.id}
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => router.back()}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/90 text-white"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Parties & Terms */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Parties */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Parties</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Label Entity</Label>
                                <Input value="Engeloop Records" disabled readOnly />
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Licensors (Legal Entities)</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleAddLicensor}
                                        className="h-6 text-xs text-[var(--accent-primary)] hover:text-[var(--accent-primary)]/80"
                                    >
                                        + Add Licensor
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {signatories.map((signatory: any, index: number) => (
                                        <div key={index} className="flex gap-2">
                                            <div className="flex-1">
                                                <ContactPicker
                                                    contacts={contacts}
                                                    value={signatory.contact_id}
                                                    onChange={(val) => handleLicensorChange(index, val)}
                                                />
                                            </div>
                                            {signatories.length > 1 && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveLicensor(index)}
                                                    className="shrink-0 text-[var(--text-dimmer)] hover:text-red-500"
                                                >
                                                    <span className="sr-only">Remove</span>
                                                    ×
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <p className="text-xs text-[var(--text-dimmer)]">
                                    Select the legal entities signing this contract. Do not select Artist Profiles.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Financial Terms */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Terms</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Label Share %</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={contract.label_share_percent || ""}
                                            onChange={(e) => setContract({ ...contract, label_share_percent: e.target.value })}
                                            className={Number(contract.label_share_percent) + Number(contract.licensor_pool_percent) !== 100 ? "border-red-300 focus-visible:ring-red-200" : ""}
                                        />
                                        <span className="absolute right-3 top-2.5 text-[var(--text-dimmer)]">%</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Licensor Pool %</Label>
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            value={contract.licensor_pool_percent || ""}
                                            onChange={(e) => setContract({ ...contract, licensor_pool_percent: e.target.value })}
                                            className={Number(contract.label_share_percent) + Number(contract.licensor_pool_percent) !== 100 ? "border-red-300 focus-visible:ring-red-200" : ""}
                                        />
                                        <span className="absolute right-3 top-2.5 text-[var(--text-dimmer)]">%</span>
                                    </div>
                                </div>
                            </div>
                            {Number(contract.label_share_percent) + Number(contract.licensor_pool_percent) !== 100 && (
                                <p className="text-xs text-[var(--accent-danger)]">
                                    Total shares must equal 100% (Current: {Number(contract.label_share_percent) + Number(contract.licensor_pool_percent)}%)
                                </p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Term & Territory */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Term & Territory</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Term Type</Label>
                                    <select
                                        className="w-full p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-main)] text-sm"
                                        value={contract.term_type || ""}
                                        onChange={(e) => setContract({ ...contract, term_type: e.target.value })}
                                    >
                                        <option value="" disabled>Select Type</option>
                                        <option value="fixed">Fixed Period</option>
                                        <option value="perpetual">Perpetual</option>
                                        <option value="auto_renew">Auto-Renew</option>
                                        <option value="evergreen_with_notice">Evergreen (w/ Notice)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Territory</Label>
                                    <Input
                                        value={contract.territory || "Universe"}
                                        onChange={(e) => setContract({ ...contract, territory: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Conditional Term Fields */}
                            {(contract.term_type === "fixed" || contract.term_type === "auto_renew") && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Initial Term (Years)</Label>
                                        <Input
                                            type="number"
                                            value={contract.term_value_years || ""}
                                            onChange={(e) => setContract({ ...contract, term_value_years: e.target.value })}
                                        />
                                    </div>
                                    {contract.term_type === "auto_renew" && (
                                        <div className="space-y-2">
                                            <Label>Renew Interval (Years)</Label>
                                            <Input
                                                type="number"
                                                value={contract.auto_renew_interval_years || ""}
                                                onChange={(e) => setContract({ ...contract, auto_renew_interval_years: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {(contract.term_type === "auto_renew" || contract.term_type === "evergreen_with_notice") && (
                                <div className="space-y-2">
                                    <Label>Notice Period (Days)</Label>
                                    <Input
                                        type="number"
                                        value={contract.notice_period_days || ""}
                                        onChange={(e) => setContract({ ...contract, notice_period_days: e.target.value })}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Key Dates */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Key Dates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Signed Date</Label>
                                    <Input
                                        type="date"
                                        value={contract.executed_at || ""}
                                        onChange={(e) => setContract({ ...contract, executed_at: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Effective Date</Label>
                                    <Input
                                        type="date"
                                        value={contract.effective_at || ""}
                                        onChange={(e) => setContract({ ...contract, effective_at: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Expiry Date</Label>
                                    <Input
                                        type="date"
                                        value={contract.expires_at || ""}
                                        onChange={(e) => setContract({ ...contract, expires_at: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <Textarea
                                    value={contract.notes || ""}
                                    onChange={(e) => setContract({ ...contract, notes: e.target.value })}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                    </Card>

                </div>

                {/* Right Column: Context */}
                <div className="space-y-6">

                    {/* Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {/* Simple status selector for now */}
                            <div className="space-y-2">
                                <Label>Current State</Label>
                                <select
                                    className="w-full p-2 rounded-md border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                                    value={contract.status}
                                    onChange={(e) => setContract({ ...contract, status: e.target.value })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="sent">Sent</option>
                                    <option value="executed">Executed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Linked Releases */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Linked Releases</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {contract.contract_releases && contract.contract_releases.length > 0 ? (
                                <ul className="space-y-2">
                                    {contract.contract_releases.map((cr: any) => (
                                        <li key={cr.releases.id} className="flex items-center justify-between p-2 rounded bg-[var(--bg-tertiary)]">
                                            <span className="text-sm font-medium">{cr.releases.title}</span>
                                            <span className="text-xs text-[var(--text-dimmer)]">{cr.releases.internal_catalog_id}</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-[var(--text-dimmer)]">No releases linked yet.</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Documents */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="border-2 border-dashed border-[var(--border-primary)] rounded-lg p-6 text-center hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer">
                                <p className="text-sm text-[var(--text-dim)]">
                                    Drag & drop signed PDF here
                                    <br />
                                    <span className="text-xs text-[var(--text-dimmer)]">or click to browse</span>
                                </p>
                            </div>
                            {contract.document_url && (
                                <div className="mt-4 flex items-center gap-2 text-sm text-[var(--accent-primary)]">
                                    <span>📄</span>
                                    <a href={contract.document_url} target="_blank" rel="noreferrer" className="hover:underline">
                                        View Signed Agreement
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
