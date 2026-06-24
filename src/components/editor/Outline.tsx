import { Editor } from '@tiptap/react';
import { useEffect, useState } from 'react';
import { ListTree } from 'lucide-react';

interface OutlineProps {
  editor: Editor | null;
}

interface HeadingItem {
  id: string;
  level: number;
  text: string;
}

export function Outline({ editor }: OutlineProps) {
  const [headings, setHeadings] = useState<HeadingItem[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          // ensure heading has ID
          let id = node.attrs.id;
          if (!id) {
            id = `h-${pos}`;
            // we could set node ID here if we wanted, but for simple outline, pos works
          }
          items.push({
            id: `h-${pos}`,
            level: node.attrs.level,
            text: node.textContent,
          });
        }
      });
      setHeadings(items);
    };

    editor.on('update', updateHeadings);
    updateHeadings();

    return () => {
      editor.off('update', updateHeadings);
    };
  }, [editor]);

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 p-4 bg-background border border-border rounded-xl shadow-sm my-6">
      <div className="flex items-center gap-2 text-sm font-semibold font-serif text-muted-foreground border-b pb-2">
        <ListTree className="w-4 h-4" />
        Document Outline
      </div>
      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-2">
        {headings.map((heading) => (
          <button
            key={heading.id}
            type="button"
            className={`text-left text-sm hover:text-primary transition-colors hover:underline truncate
              ${heading.level === 1 ? 'font-semibold mt-1 text-foreground' : ''}
              ${heading.level === 2 ? 'pl-4 text-muted-foreground font-medium' : ''}
              ${heading.level === 3 ? 'pl-8 text-muted-foreground/80' : ''}
            `}
            onClick={() => {
              // Extract pos from id
              const pos = parseInt(heading.id.replace('h-', ''), 10);
              if (!isNaN(pos)) {
                // Try to scroll to node. This is a bit hacky but works for Prosemirror.
                const dom = editor?.view.nodeDOM(pos);
                if (dom instanceof HTMLElement) {
                  dom.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }
            }}
          >
            {heading.text}
          </button>
        ))}
      </div>
    </div>
  );
}
