import { Ionicons } from '@expo/vector-icons';
import React from 'react';

interface IconSymbolProps {
  name: keyof typeof Ionicons.glyphMap;
  size: number;
  color: string;
}

export function IconSymbol({ name, size, color }: IconSymbolProps) {
  return <Ionicons name={name} size={size} color={color} />;
}