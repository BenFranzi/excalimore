import { create } from 'zustand';

export enum Tool {
  SELECTION = 'SELECTION',
  RECTANGLE = 'RECTANGLE',
  LINE = 'LINE'
}

interface BearState {
  tool: Tool
  setTool: (by: Tool) => void
}

const useToolStore = create<BearState>((set) => ({
  tool: Tool.RECTANGLE,
  setTool: (tool: Tool) => set(() => ({ tool })),
}));

export default useToolStore;