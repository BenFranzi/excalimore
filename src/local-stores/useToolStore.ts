import { create } from 'zustand';

export enum Tool {
  SELECTION = 'SELECTION',
  RECTANGLE = 'RECTANGLE'
}

interface BearState {
  tool: Tool
  setTool: (by: Tool) => void
}

const useToolStore = create<BearState>((set) => ({
  tool: Tool.SELECTION,
  setTool: (tool: Tool) => set(() => ({ tool })),
}));

export default useToolStore;