import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

/**
 * The one loading/error/ready state machine — every data page (documents list,
 * editor, report) uses this instead of hand-rolling fetch state.
 */
export type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

interface UseLoadResult<T> {
  state: LoadState<T>;
  /** Re-run the loader (e.g. after a mutation that changed server state). */
  reload: () => void;
  /** Update loaded data in place (e.g. remove a deleted row) — no refetch. */
  setData: (updater: (data: T) => T) => void;
}

export const useLoad = <T>(load: () => Promise<T>, deps: ReadonlyArray<unknown> = []): UseLoadResult<T> => {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });

  // eslint-disable-next-line react-hooks/exhaustive-deps -- deps are the caller's contract
  const reload = useCallback(() => {
    setState({ status: "loading" });
    load()
      .then((data) => {
        setState({ status: "ready", data });
      })
      .catch((err) => {
        setState({ status: "error", message: err instanceof ApiError ? err.message : "something went wrong" });
      });
  }, deps);

  useEffect(() => {
    reload();
  }, [reload]);

  const setData = (updater: (data: T) => T) => {
    setState((prev) => {
      if (prev.status !== "ready") {
        return prev;
      }
      return { status: "ready", data: updater(prev.data) };
    });
  };

  return { state, reload, setData };
};
