import { KeyboardEvent, MouseEvent, ReactNode, TouchEvent, useEffect, useRef, useState } from 'react';
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
  ctx.strokeStyle = 'white';
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


function drawLine(ctx: CanvasRenderingContext2D, offsets: Offsets, element: Element, isSelected: boolean) {
  ctx.strokeStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(element.x + offsets.x, element.y + offsets.y);
  ctx.lineTo(element.width + offsets.x, element.height + offsets.y);
  ctx.stroke();

  if (isSelected) {
    ctx.strokeStyle = 'lightblue';
    ctx.beginPath();
    ctx.moveTo(element.x + SELECTION_GAP + offsets.x, element.y + offsets.y);
    ctx.lineTo(element.width + SELECTION_GAP + offsets.x, element.height + offsets.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(element.x - SELECTION_GAP + offsets.x, element.y + offsets.y);
    ctx.lineTo(element.width - SELECTION_GAP + offsets.x, element.height + offsets.y);
    ctx.stroke();
  }
}

const renderer = {
  line: drawLine,
  rectangle: drawRectangle,
};

function drawScene(ctx: CanvasRenderingContext2D, offsets: Offsets, elements: Element[], selectedElements: Element['id'][]) {
  const selectedMap = selectedElements.reduce((acc, next) => ({ ...acc, [next]: true }), { });
  for (const element of elements) {
    renderer[element.type](ctx, offsets, element, Boolean(selectedMap[element.id]));
  }
}

const LINE_ACCURACY = 60;

function isClickingLine(point: Coordinates, element: Element): boolean {
  const x1 = element.x;
  const y1 = element.y;
  const x2 = element.x + element.width;
  const y2 = element.y + element.height;

  const a = y1 - y2;
  const b = x2 - x1;
  const c = x1 * y2 - x2 * y1;

  const distanceFromLine = Math.abs(a * point.x + b * point.y + c) / Math.sqrt(a ** 2 + b ** 2);

  const isBetweenX = (Math.min(x1, x2) <= point.x && point.x <= Math.max(x1, x2));
  const isBetweenY = (Math.min(y1, y2) <= point.y && point.y <= Math.max(y1, y2));

  return distanceFromLine < LINE_ACCURACY && isBetweenX && isBetweenY;
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
      case 'line':
        if (isClickingLine(coordinates, element)) {
          return element;
        }
        break;
    }
  }

  return undefined;
}

function getEventCoordinates(event: MouseEvent | TouchEvent, canvasRef?: HTMLCanvasElement | null): Coordinates {
  if (event.type.includes('mouse')) { // TODO: handle events using types
    return {
      x: (event as MouseEvent).clientX - (event.currentTarget as HTMLElement).offsetLeft,
      y: (event as MouseEvent).clientY - (event.currentTarget as HTMLElement).offsetTop,
    };
  }

  if (!event.currentTarget && canvasRef) {
    return {
      x: (event as TouchEvent).touches[0].clientX - canvasRef.offsetLeft,
      y: (event as TouchEvent).touches[0].clientY - canvasRef.offsetTop,
    };
  }

  return {
    x: (event as TouchEvent).touches[0].clientX - (event.currentTarget as HTMLElement).offsetLeft,
    y: (event as TouchEvent).touches[0].clientY - (event.currentTarget as HTMLElement).offsetTop,
  };
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
  const [handCoordinates, setHandCoordinates] = useState<Coordinates | null>(null);
  const [handOffsets, setHandOffsets] = useState<Coordinates | null>(null);

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
      setIsShift(false);
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
    if (tool !== Tool.SELECTION) {
      setSelectedElements([]);
    }
  }, [tool, setSelectedElements]);
  useEffect(() => {
    if (canvasRef.current) {
      onRender();
      canvasRef.current.addEventListener('wheel', onWheel,  { passive: true });
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

  function onDown(event: MouseEvent<HTMLCanvasElement> | TouchEvent) {
    const eventCoordinates = getEventCoordinates(event);

    const coordinates = {
      x: eventCoordinates.x - offsets.x,
      y: eventCoordinates.y - offsets.y
    };

    if (tool === Tool.HAND) {
      setHandCoordinates(eventCoordinates);
      setHandOffsets(offsets);
    }

    if (tool === Tool.SELECTION) {
      const element = getClickedElement(elements, coordinates);
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

    if (tool === Tool.RECTANGLE) {
      const element: Element = {
        id: crypto.randomUUID(),
        type: 'rectangle',
        x: coordinates.x,
        y: coordinates.y,
        width: 0,
        height: 0,
      };
      setDraggingElement(element);
      setAction('resize');
      setElements([...elements, element]);
    }


    if (tool === Tool.LINE) {
      const element: Element = {
        id: crypto.randomUUID(),
        type: 'line',
        x: coordinates.x,
        y: coordinates.y,
        width: 0,
        height: 0,
      };
      setDraggingElement(element);
      setAction('resize');
      setElements([...elements, element]);
    }

    onRender();
  }

  function onMove(event: MouseEvent<HTMLCanvasElement> |  TouchEvent) {
    const eventCoordinate: Coordinates = getEventCoordinates(event);

    if (tool === Tool.HAND && handCoordinates != null) {

      setOffsets((previous) => {
        if (event.type.includes('mouse') || !handOffsets) {
          return {
            x: previous.x + (event as MouseEvent).movementX,
            y: previous.y + (event as MouseEvent).movementY
          };
        }
        const touchEvent = event as TouchEvent;
        const current = getEventCoordinates(touchEvent, canvasRef.current);


        const movementX = current.x - handCoordinates.x;
        const movementY = current.y - handCoordinates.y;

        return {
          x: handOffsets.x + movementX,
          y: handOffsets.y + movementY
        };
      });




    } else {
      if (draggingElement == null) return;

      switch (action) {
        case 'resize':
          if (draggingElement.type === 'rectangle') {
            draggingElement.width = eventCoordinate.x - draggingElement.x - offsets.x;
            draggingElement.height = eventCoordinate.y - draggingElement.y - offsets.y;
          }

          if (draggingElement.type === 'line') {
            draggingElement.width = eventCoordinate.x - offsets.x;
            draggingElement.height = eventCoordinate.y - offsets.y;
          }
          break;
        case 'drag':
          const elementsMap = elements.reduce((acc, next) => ({ ...acc, [next.id]: next }), {});

          const newCoordinates: Coordinates = {
            x: eventCoordinate.x - offsets.x - mouseDownOffset.x,
            y: eventCoordinate.y - offsets.y - mouseDownOffset.y,
          };

          const deltaX = newCoordinates.x - draggingElement.x;
          const deltaY = newCoordinates.y - draggingElement.y;
          draggingElement.x = newCoordinates.x;
          draggingElement.y = newCoordinates.y;

          if (draggingElement.type === 'line') {
            draggingElement.width = draggingElement.width += deltaX;
            draggingElement.height = draggingElement.height += deltaY;
          }

          for (const selectedId of selectedElements) {
            if (selectedId === draggingElement.id) continue;

            elementsMap[selectedId].x += deltaX;
            elementsMap[selectedId].y += deltaY;

            if (elementsMap[selectedId].type === 'line') {
              elementsMap[selectedId].width = elementsMap[selectedId].width += deltaX;
              elementsMap[selectedId].height = elementsMap[selectedId].height += deltaY;
            }
          }
          break;
      }
    }


    onRender();
  }

  function onUp(_: MouseEvent<HTMLCanvasElement> | TouchEvent) {
    setDraggingElement(null);
    onRender();
    setHandCoordinates(null);
  }

  return (
    <div>
      <canvas
        ref={ canvasRef }
        className={ s.canvas }
        height={ window.innerHeight }
        style={ { cursor: tool === Tool.HAND ? 'grab' : 'pointer' } }
        width={ window.innerWidth }
        onMouseDown={ onDown }
        onMouseMove={ onMove }
        onMouseUp={ onUp }
        onTouchEnd={ onUp }
        onTouchMove={ onMove }
        onTouchStart={ onDown }
      />
    </div>
  );
}

export default InfiniteCanvas;