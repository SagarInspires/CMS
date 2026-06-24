import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';

export const CommandList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = props.items[index];
    if (item) {
      props.command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }
      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }
      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }
      return false;
    },
  }));

  if (!props.items.length) {
    return null;
  }

  return (
    <div className="flex flex-col bg-popover text-popover-foreground rounded-lg shadow-xl border overflow-hidden p-1 min-w-[240px]">
      {props.items.map((item: any, index: number) => (
        <button
          className={`flex items-center gap-2 px-3 py-2 text-sm text-left rounded-md transition-colors ${
            index === selectedIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
          }`}
          key={index}
          onClick={() => selectItem(index)}
        >
          {item.icon && <span className="flex-shrink-0 opacity-70">{item.icon}</span>}
          <div>
            <div className="font-medium">{item.title}</div>
            {item.description && <div className="text-xs opacity-70">{item.description}</div>}
          </div>
        </button>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList';
