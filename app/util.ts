export function getEnvVariable(
  name: string,
  default_value: string | null = null,
): string | null {
  // Try and pull vite env var or default to default value...
  const viteVar = "VITE_" + name.toUpperCase();
  const value = import.meta.env[viteVar];
  return value || default_value;
}

const TRUTHY = ["y", "yes", "true", "t", "1", "on"];

export function getEnvVariableBool(
  name: string,
  default_value: boolean = false,
): boolean {
  const value = getEnvVariable(name);
  if (value === null) return default_value;

  // Check to see if they meant yes after basic cleanup
  return TRUTHY.includes(value.toLowerCase().trim());
}
