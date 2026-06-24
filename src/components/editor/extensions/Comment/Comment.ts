import { Mark, mergeAttributes } from '@tiptap/core';

export interface CommentOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType;
      unsetComment: (commentId: string) => ReturnType;
    };
  }
}

export const Comment = Mark.create<CommentOptions>({
  name: 'comment',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => {
          if (!attributes.commentId) {
            return {};
          }
          return {
            'data-comment-id': attributes.commentId,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-comment-id]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { class: 'bg-yellow-200/50 dark:bg-yellow-500/30 border-b-2 border-yellow-400 cursor-pointer transition-colors hover:bg-yellow-300/50 dark:hover:bg-yellow-500/50' }), 0];
  },

  addCommands() {
    return {
      setComment:
        (commentId) =>
        ({ commands }) => {
          return commands.setMark(this.name, { commentId });
        },
      unsetComment:
        (commentId) =>
        ({ tr, dispatch }) => {
          if (!dispatch) return false;

          let hasRemoved = false;
          
          tr.doc.descendants((node, pos) => {
            if (node.marks) {
              const mark = node.marks.find((m) => m.type.name === this.name && m.attrs.commentId === commentId);
              if (mark) {
                tr.removeMark(pos, pos + node.nodeSize, mark.type);
                hasRemoved = true;
              }
            }
          });
          
          return hasRemoved;
        },
    };
  },
});
