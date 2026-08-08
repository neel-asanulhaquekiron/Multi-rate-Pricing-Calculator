// Vitest does not auto-load .env; tests need DATABASE_URL + JWT_SECRET.
try {
  process.loadEnvFile(".env");
} catch {
  // In CI the variables come from the environment instead of a file.
}
