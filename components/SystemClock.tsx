'use client';
import { useEffect, useState } from 'react';

function fmt() {
  return new Date().toISOString().substring(0, 19).replace('T', ' ') + ' UTC';
}

export default function SystemClock() {
  const [time, setTime] = useState(fmt);
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setTime(fmt()), 1000);
    const bid = setInterval(() => setBlink(b => !b), 500);
    return () => { clearInterval(id); clearInterval(bid); };
  }, []);

  return (
    <span suppressHydrationWarning className="font-mono">
      {time}
      <span className={`ml-0.5 transition-opacity duration-100 ${blink ? 'opacity-100' : 'opacity-0'}`}>▌</span>
    </span>
  );
}
