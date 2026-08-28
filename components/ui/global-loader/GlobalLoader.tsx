'use client';

import { useEffect, useState } from 'react';
import { LOADER_TYPE_MESSAGES } from './loader-types';

interface GlobalLoaderProps {
  open: boolean;
  message: string;
}

// Abstract clinical pulse — not a literal hospital monitor trace.
const PULSE_PATH = 'M2 30 L88 30 L104 30 L118 11 L134 49 L146 23 L156 30 L208 30 L220 30 L232 18 L248 43 L258 30 L318 30';

export default function GlobalLoader(_props: GlobalLoaderProps) {
  return null;
}
