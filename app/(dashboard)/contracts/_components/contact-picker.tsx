"use client"

import * as React from "react"
import { Select } from "@/components/ui/select"

interface Contact {
    id: string
    full_legal_name: string
    email: string
}

interface ContactPickerProps {
    contacts: Contact[]
    value?: string
    onChange: (value: string) => void
    disabled?: boolean
}

export function ContactPicker({ contacts, value, onChange, disabled }: ContactPickerProps) {
    return (
        <select
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full p-2 border border-gray-300 rounded-md" // Added some basic styling for native select
        >
            <option value="" disabled>Select a licensor...</option>
            {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                    {contact.full_legal_name} ({contact.email})
                </option>
            ))}
        </select>
    )
}
