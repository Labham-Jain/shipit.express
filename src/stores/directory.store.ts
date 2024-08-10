import { create } from "zustand";

type DirectoryState = {
  current: string;
  target: string;
  project: string;
}

const directoryState = create<DirectoryState>(
  (set) => ({
    current: '',
    target: '',
    project: '',
    set
  })
)
export default directoryState