import { useEffect, useRef, useState } from "react";
import useStore from "../store/useStore";
import {
  FIELDS,
  STATE_VERSION,
  VERSION_KEY,
  buildPatch,
  migrate,
} from "../store/persistenceSchema";

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

/**
 * 立即落盘，不等 500ms 防抖。
 *
 * 用在「结束这一集」这种她很可能马上关掉 app 的时刻 ——
 * 否则防抖窗口内退出会丢掉刚听完的那一集（进度回退一集 + 珍珠不发）。
 * zustand 的 set 是同步的，所以调用方改完 store 直接调这个即可。
 */
export function flushPersistence(): void {
  void saveSnapshot();
}

/** 把 store 当前快照按注册表写入 IndexedDB（模块级，只依赖 getState） */
async function saveSnapshot(): Promise<void> {
  try {
    const s = useStore.getState();
    for (const f of FIELDS) {
      await setItem(f.key, f.read(s));
    }
    await setItem(VERSION_KEY, STATE_VERSION);
  } catch (e) {
    console.error("Failed to save state:", e);
  }
}

export function usePersistence() {
  // 以下订阅只用于触发保存，保存时实际读取 getState() 快照，不存在闭包过期问题
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
  const lastLoginDate = useStore((s) => s.lastLoginDate);
  const consecutiveDays = useStore((s) => s.consecutiveDays);
  const currentEp = useStore((s) => s.currentEp);
  const episodeProgress = useStore((s) => s.episodeProgress);
  const seasonUnlocks = useStore((s) => s.seasonUnlocks);
  const generatedEpisodes = useStore((s) => s.generatedEpisodes);
  const shiftDate = useStore((s) => s.shiftDate);
  const shiftDoneToday = useStore((s) => s.shiftDoneToday);
  const loadedRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const version = ((await getItem(VERSION_KEY)) as number) ?? 1;
        const raw: Record<string, unknown> = {};
        for (const f of FIELDS) {
          raw[f.key] = await getItem(f.key);
        }
        const patch = buildPatch(migrate(version, raw));
        if (!cancelled && Object.keys(patch).length > 0) {
          useStore.setState(patch);
        }
      } catch (e) {
        console.error("Failed to load state:", e);
      } finally {
        if (!cancelled) {
          loadedRef.current = true;
          setLoaded(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;
    const timer = setTimeout(saveSnapshot, 500);
    return () => clearTimeout(timer);
  }, [
    loaded,
    fragments,
    pearls,
    rareShells,
    masteredNodes,
    answerRecords,
    sneakAttacks,
    redemptions,
    diagnosticsCompleted,
    playTokens,
    solvedSoups,
    revealedSoups,
    lastLoginDate,
    consecutiveDays,
    currentEp,
    episodeProgress,
    seasonUnlocks,
    generatedEpisodes,
    shiftDate,
    shiftDoneToday,
  ]);

  return loaded;
}
