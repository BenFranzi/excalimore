import s from './styles.module.css';
import useToolStore, { Tool } from '@/local-stores/useToolStore.ts';

const tools: { tool: Tool, label: string, value: string }[] = [
  {
    tool: Tool.HAND,
    label: 'Hand',
    value: 'hand'
  },
  {
    tool: Tool.SELECTION,
    label: navigator?.maxTouchPoints === 0 ? 'Selection - hold shift to select multiple' : 'Selection',
    value: 'selection'
  },
  {
    tool: Tool.RECTANGLE,
    label: 'Rectangle',
    value: 'rectangle',
  },
  {
    tool: Tool.LINE,
    label: 'Line',
    value: 'line',
  }
];

function Tools() {
  const { tool: selectedTool, setTool } = useToolStore();

  return (
    <div className={ s.tools }>
      <fieldset>
        <legend>Select a tool</legend>
        {
          tools.map(({ tool, label, value }) => (
            <div key={ tool }>
              <input
                checked={ selectedTool === tool }
                id={ value }
                name='tool'
                type='radio'
                value={ value }
                onChange={ () => setTool(tool) }
              />
              <label htmlFor={ value }>{label}</label>
            </div>
          ))
        }
      </fieldset>

    </div>
  );
}
export default Tools;

/*
Tasks:
- add title to label eg (title="Selection — V or 1")

 */