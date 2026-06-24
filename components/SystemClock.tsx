'use client';
import { useEffect, useState } from 'react';

function fmt() {
  return new Date().toISOString().substring(0, 19).replace('T', ' ') + ' UTC';
}

export default function SystemClock() {
  const [time, setTime] = useState(fmt);

  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000);
    return () => clearInterval(id);
  }, []);

  return <span suppressHydrationWarning>{time}</span>;
}
