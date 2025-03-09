type ClassValue = string | number | boolean | undefined | null;
type ClassArray = ClassValue[];
type ClassDictionary = Record<string, string | number | boolean | undefined | null>;
type ClassInput = ClassValue | ClassArray | ClassDictionary;

export function cn(...inputs: ClassInput[]): string {
  const classes = inputs.filter(Boolean);
  return classes.join(' ');
}
