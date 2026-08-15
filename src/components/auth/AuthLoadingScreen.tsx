export function AuthLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6">
      <div
        className="flex items-center gap-3 text-sm text-muted-foreground"
        role="status"
        aria-live="polite"
      >
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent" />
        Restoring your study session…
      </div>
    </main>
  );
}
