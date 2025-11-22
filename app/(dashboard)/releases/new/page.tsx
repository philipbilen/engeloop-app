import { CreateReleaseForm } from "@/components/releases/create-release-form"

export default function NewReleasePage() {
  return (
    <div className="w-full p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8 border-b border-[var(--border-primary)] pb-6">
          <h1 className="text-2xl font-bold text-[var(--text-bright)] tracking-tight mb-2">
            Create New Release
          </h1>
          <p className="text-sm text-[var(--text-dim)]">
            Enter basic release information to generate a catalog number
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-primary)] p-6 rounded-sm">
          <CreateReleaseForm />
        </div>
      </div>
    </div>)
}
