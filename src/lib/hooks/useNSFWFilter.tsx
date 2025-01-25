import { useState, useEffect } from 'react';
import { type ClankerWithData } from '../types';

export const useNSFWFilter = () => {
  const [showNSFW, setShowNSFW] = useState(false);

  useEffect(() => {
    const storedShowNSFW = typeof window !== 'undefined' ? window.localStorage.getItem('showNSFW') : null;
    setShowNSFW(storedShowNSFW === null ? false : storedShowNSFW === 'true');
  }, []);

  const setNSFW = (nsfw: boolean) => {
    const newValue = nsfw;
    setShowNSFW(newValue);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('showNSFW', newValue.toString());
    }
  };

  const filterNSFW = (items: ClankerWithData[]) => {
    if (!showNSFW) {
      const nsfwItems = items.filter((item) => item.nsfw);
      console.log("Removing NSFW items: ", nsfwItems.map((i) => i.name).join(", "));
    }
    return items.filter((item) => showNSFW || !item.nsfw);
  };

  const isAllowed = (item: { nsfw: boolean }) => {
    return showNSFW || !item.nsfw;
  };

  return { showNSFW, setShowNSFW: setNSFW, filterNSFW, isAllowed };
};
