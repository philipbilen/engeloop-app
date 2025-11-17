import { CreateReleaseForm } from "@/components/releases/create-release-form"

export default function NewReleasePage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-[var(--text-primary)] text-2xl font-semibold uppercase tracking-wide mb-2">
            CREATE NEW RELEASE
          </h1>
          <p className="text-[var(--text-secondary)] text-sm">
            Enter basic release information to generate a catalog number
          </p>
        </div>

        <CreateReleaseForm />
      </div>
    </div>
  )
}
