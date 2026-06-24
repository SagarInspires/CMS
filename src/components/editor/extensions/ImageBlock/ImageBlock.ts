import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageBlockView } from './ImageBlockView';

export interface ImageBlockOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageBlock: {
      setImageBlock: (options: { src: string; alt?: string; caption?: string; alignment?: 'left' | 'center' | 'right' | 'full' }) => ReturnType;
    };
  }
}

export const ImageBlock = Node.create<ImageBlockOptions>({
  name: 'imageBlock',
  group: 'block',
  content: 'inline*',
  draggable: true,
  isolating: true,

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: '',
      },
      caption: {
        default: '',
      },
      alignment: {
        default: 'center',
      },
      uploading: {
        default: false,
      },
      progress: {
        default: 0,
      },
      error: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'figure[data-type="imageBlock"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, any> }) {
    return ['figure', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'imageBlock' }), ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }], ['figcaption', 0]];
  },

  addCommands() {
    return {
      setImageBlock:
        (options: { src: string; alt?: string; caption?: string; alignment?: 'left' | 'center' | 'right' | 'full' }) =>
        ({ commands }: { commands: any }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageBlockView);
  },
});
