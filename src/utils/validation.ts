import { z } from 'zod';

export const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;

export const emailSchema = z.string().email('Email invalide');
export const phoneSchema = z.string().regex(phoneRegex, 'Numéro de téléphone invalide');
export const passwordSchema = z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères');

export const validatePhone = (phone: string): boolean => {
  return phoneRegex.test(phone);
};

export const validateEmail = (email: string): boolean => {
  return emailSchema.safeParse(email).success;
};