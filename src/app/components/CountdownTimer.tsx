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
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    now.getHours() + (now.getMinutes() >= 30 ? 1 : 0),
    0,
    0
  );
};

const formatTimeRemaining = (timeRemaining: number) => {
  const minutes = Math.floor((timeRemaining / (1000 * 60)) % 60);
  const seconds = Math.floor((timeRemaining / 1000) % 60);
  return `${minutes}m ${seconds}s left`;
};

export default CountdownTimer;