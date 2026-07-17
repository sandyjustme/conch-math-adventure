import { useEffect, useCallback } from "react";
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
    } catch (e) {
      console.error("Failed to load state:", e);
    }
  }, []);

  const save = useCallback(async () => {
    try {
      await setItem("shells", { fragments, pearls });
      await setItem("masteredNodes", masteredNodes);
      await setItem("sneakAttacks", sneakAttacks);
      await setItem("answerRecords", answerRecords);
      await setItem("redemptions", redemptions);
      await setItem("rareShells", rareShells);
      await setItem("diagnosticsCompleted", diagnosticsCompleted);
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
  ]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const timer = setTimeout(save, 500);
    return () => clearTimeout(timer);
  }, [fragments, pearls, masteredNodes.length, save]);
}
