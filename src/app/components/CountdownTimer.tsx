"use client"

import React, { useState, useEffect } from 'react';

export const CountdownTimer = () => {
  const endTime = calculateEndTime();
  const [timeRemaining, setTimeRemaining] = useState(endTime.getTime() - new Date().getTime());
  const [isDeploying, setIsDeploying] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const remaining = endTime.getTime() - now;
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        setIsDeploying(true);
        clearInterval(interval);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <div>
      {isDeploying ? 'now deploying...' : formatTimeRemaining(timeRemaining)}
    </div>
  );
};

const calculateEndTime = () => {
  const now = new Date();
  const today = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 18, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
  return now.getTime() < today.getTime() ? today : tomorrow;
};

const formatTimeRemaining = (timeRemaining: number) => {
  const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
  const seconds = Math.floor((timeRemaining / 1000) % 60);
  return `${hours}h ${minutes}m ${seconds}s left`;
};

export default CountdownTimer;