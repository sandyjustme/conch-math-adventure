import { useEffect, useCallback, useRef, useState } from "react";
import useStore from "../store/useStore";

const DB_NAME = "conch-math";
const DB_VERSION = 1;
const STORE_NAME = "app-state";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getItem(key: string): Promise<any> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function setItem(key: string, value: any): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put(value, key);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export function usePersistence() {
  const fragments = useStore((s) => s.fragments);
  const pearls = useStore((s) => s.pearls);
  const rareShells = useStore((s) => s.rareShells);
  const masteredNodes = useStore((s) => s.masteredNodes);
  const answerRecords = useStore((s) => s.answerRecords);
  const sneakAttacks = useStore((s) => s.sneakAttacks);
  const redemptions = useStore((s) => s.redemptions);
  const diagnosticsCompleted = useStore((s) => s.diagnosticsCompleted);
  const playTokens = useStore((s) => s.playTokens);
  const solvedSoups = useStore((s) => s.solvedSoups);
  const revealedSoups = useStore((s) => s.revealedSoups);
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const shells = await getItem("shells");
      if (shells != null) {
        useStore.setState({
          fragments: shells.fragments ?? 0,
          pearls: shells.pearls ?? 0,
        });
      }
      const mastered = await getItem("masteredNodes");
      if (mastered) useStore.setState({ masteredNodes: mastered });
      const attacks = await getItem("sneakAttacks");
      if (attacks) useStore.setState({ sneakAttacks: attacks });
      const records = await getItem("answerRecords");
      if (records) useStore.setState({ answerRecords: records });
      const reds = await getItem("redemptions");
      if (reds) useStore.setState({ redemptions: reds });
      const shells2 = await getItem("rareShells");
      if (shells2) useStore.setState({ rareShells: shells2 });
      const diag = await getItem("diagnosticsCompleted");
      if (diag === true) useStore.setState({ diagnosticsCompleted: true });
      const loginDate = await getItem("lastLoginDate");
      if (typeof loginDate === "string")
        useStore.setState({ lastLoginDate: loginDate });
      const consDays = await getItem("consecutiveDays");
      if (typeof consDays === "number")
        useStore.setState({ consecutiveDays: consDays });
      const tokens = await getItem("playTokens");
      if (typeof tokens === "number") useStore.setState({ playTokens: tokens });
      const ss = await getItem("solvedSoups");
      if (Array.isArray(ss)) useStore.setState({ solvedSoups: ss });
      const rs = await getItem("revealedSoups");
      if (Array.isArray(rs)) useStore.setState({ revealedSoups: rs });
    } catch (e) {
      console.error("Failed to load state:", e);
    } finally {
      loadedRef.current = true;
      setLoaded(true);
    }
  }, []);

  const lastLoginDate = useStore((s) => s.lastLoginDate);
  const consecutiveDays = useStore((s) => s.consecutiveDays);

  const save = useCallback(async () => {
    try {
      await setItem("shells", { fragments, pearls });
      await setItem("masteredNodes", masteredNodes);
      await setItem("sneakAttacks", sneakAttacks);
      await setItem("answerRecords", answerRecords);
      await setItem("redemptions", redemptions);
      await setItem("rareShells", rareShells);
      await setItem("diagnosticsCompleted", diagnosticsCompleted);
      await setItem("lastLoginDate", lastLoginDate);
      await setItem("consecutiveDays", consecutiveDays);
      await setItem("playTokens", playTokens);
      await setItem("solvedSoups", solvedSoups);
      await setItem("revealedSoups", revealedSoups);
    } catch (e) {
      console.error("Failed to save state:", e);
    }
  }, [
    fragments,
    pearls,
    masteredNodes,
    sneakAttacks,
    answerRecords,
    redemptions,
    rareShells,
    diagnosticsCompleted,
    lastLoginDate,
    consecutiveDays,
    playTokens,
    solvedSoups,
    revealedSoups,
  ]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setTimeout(save, 500);
    return () => clearTimeout(timer);
  }, [fragments, pearls, masteredNodes.length, save]);

  return loaded;
}
