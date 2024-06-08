import { KeyboardEvent, MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import s from './styles.module.css';
import useToolStore, { Tool } from '@/local-stores/useToolStore.ts';

type Element = {
  id: string;
  type: 'rectangle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
}

type Coordinates = {
  x: number;
  y: number;
}

type Offsets = Coordinates;

const SELECTION_GAP = 8;

function drawRectangle(ctx: CanvasRenderingContext2D, offsets: Offsets, element: Element, isSelected: boolean) {
  ctx.strokeStyle = 'black';
  ctx.strokeRect(element.x + offsets.x, element.y + offsets.y, element.width, element.height);
  if (isSelected) {
    ctx.strokeStyle = 'lightblue';
    ctx.strokeRect(
      element.x + offsets.x - SELECTION_GAP,
      element.y + offsets.y - SELECTION_GAP,
      element.width + SELECTION_GAP * 2,
      element.height + SELECTION_GAP * 2
    );
  }
}

function drawScene(ctx: CanvasRenderingContext2D, offsets: Offsets, elements: Element[], selectedElements: Element['id'][]) {
  const selectedMap = selectedElements.reduce((acc, next) => ({ ...acc, [next]: true }), { });
  for (const element of elements) {
    drawRectangle(ctx, offsets, element, Boolean(selectedMap[element.id]));
  }
}

function getClickedElement(elements: Element[], coordinates: Coordinates): Element | undefined {
  for (const element of elements) {
    switch (element.type) {
      case 'rectangle':
        if (
          coordinates.x > element.x
          && coordinates.y > element.y
          && coordinates.x < element.x + element.width
          && coordinates.y < element.y + element.height
        ) {
          return element;
        }
        break;
    }
  }

  return undefined;
}

function InfiniteCanvas(): ReactNode {
  const tool = useToolStore((state) => state.tool);
  const [isShift, setIsShift] = useState(false);
  const [offsets, setOffsets] = useState<Coordinates>({ x: 0, y: 0 });
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElements, setSelectedElements] = useState<Element['id'][]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [action, setAction] = useState<'resize'|'drag'>('resize');
  const [draggingElement, setDraggingElement] = useState<Element | null>(null);
  const [mouseDownOffset, setMouseDownOffset] = useState<Coordinates>({ x: 0, y: 0 }); // offset from elements x, y

  function onWheel(event: WheelEvent) {
    setOffsets((previous) => {
      return {
        x: previous.x - event.deltaX,
        y: previous.y - event.deltaY,
      };
    });
  }

  function onShiftDown(event: KeyboardEvent) {
    if (event.shiftKey) {
      setIsShift(true);
    }
  }
  function onShiftUp(event: KeyboardEvent) {
    if (!event.shiftKey) {
      setIsShift(true);
    }
  }

  useEffect(() => {
    document.addEventListener('keydown', onShiftDown);
    document.addEventListener('keyup', onShiftUp);
    return () => {
      document.addEventListener('keydown', onShiftDown);
      document.addEventListener('keyup', onShiftUp);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) {
      onRender();
      canvasRef.current.addEventListener('wheel', onWheel);
    }
    return () => {
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('wheel', onWheel);
      }
    };
  }, [canvasRef, offsets]);

  function onRender(): void {
    if (!canvasRef.current) {
      return;
    }

    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    drawScene(ctx, offsets, elements, selectedElements);
  }

  function onDown(event: MouseEvent<HTMLCanvasElement>) {
    const coordinates = {
      x: event.clientX - event.currentTarget.offsetLeft - offsets.x,
      y: event.clientY - event.currentTarget.offsetTop - offsets.y
    };

    if (tool === Tool.RECTANGLE) {
      const element: Element = {
        id: crypto.randomUUID(),
        type: 'rectangle',
        x: event.clientX - event.currentTarget.offsetLeft - offsets.x,
        y: event.clientY - event.currentTarget.offsetTop - offsets.y,
        width: 0,
        height: 0,
      };
      setDraggingElement(element);
      setAction('resize');
      setElements([...elements, element]);
    }

    if (tool === Tool.SELECTION) {
      const element = getClickedElement(elements, coordinates);
      console.log(event);
      if (element === undefined) {
        setSelectedElements([]);
        setDraggingElement(null);
      } else {
        if (isShift) {
          setSelectedElements([...selectedElements, element.id]);
        } else {
          setSelectedElements([element.id]);
        }

        setAction('drag');
        setDraggingElement(element);
        setMouseDownOffset({
          x: coordinates.x - element.x,
          y: coordinates.y - element.y,
        });
      }
    }
    onRender();
  }

  function onMove(event: MouseEvent<HTMLCanvasElement>) {
    if (draggingElement == null) return;

    switch (action) {
      case 'resize':
        draggingElement.width = event.clientX - event.currentTarget.offsetLeft - draggingElement.x - offsets.x;
        draggingElement.height = event.clientY - event.currentTarget.offsetTop - draggingElement.y - offsets.y;
        break;
      case 'drag':
        const elementsMap = elements.reduce((acc, next) => ({ ...acc, [next.id]: next }), {});
        const originalCoordinates: Coordinates = {
          x: draggingElement.x,
          y: draggingElement.y,
        };

        draggingElement.x = event.clientX - event.currentTarget.offsetLeft - offsets.x - mouseDownOffset.x;
        draggingElement.y = event.clientY - event.currentTarget.offsetTop - offsets.y - mouseDownOffset.y;

        // for (const selectedId of selectedElements) {
        //   if (selectedId === draggingElement.id) continue;
        //
        //   elementsMap[selectedId].x = event.clientX - event.currentTarget.offsetLeft - offsets.x - originalCoordinates.x + mouseDownOffset.x;
        //   elementsMap[selectedId].y = event.clientY - event.currentTarget.offsetTop - offsets.y - originalCoordinates.y + mouseDownOffset.y;
        // }
        break;
    }


    onRender();
  }

  function onUp(_: MouseEvent<HTMLCanvasElement>) {
    setDraggingElement(null);
    onRender();
  }

  return (
    <div>
      <canvas
        ref={ canvasRef }
        className={ s.canvas }
        height={ window.innerHeight }
        width={ window.innerWidth }
        onMouseDown={ onDown }
        onMouseMove={ onMove }
        onMouseUp={ onUp }
        onScroll={ console.log }
      />
    </div>
  );
}

export default InfiniteCanvas;