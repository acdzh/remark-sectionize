import { findAfter } from 'unist-util-find-after';
import { visit } from 'unist-util-visit';

const DEFAULT_OPTIONS = {
  flatten: false,
  max_depth: 6,
};

const plugin = (_options = {}) => {
  const options = { ...DEFAULT_OPTIONS, ..._options };

  const sectionize = (node, index, parent) => {
    const start = node
    const startIndex = index
    const depth = start.depth
  
    const end = findAfter(parent, start, (node) => {
      if (node.type === 'export') {
        return true;
      }
      if (options.flatten) {
        // 如果要拍平的结构，找到下一个 heading 即可
        return node.type === 'heading';
      } else {
        // 如果要嵌套的结构，需要找到下一个级别更高的 heading（级别更高 === 深度更小）
        return node.type === 'heading' && node.depth <= depth; 
      }
      return false;
    });
    const endIndex = parent.children.indexOf(end);
  
    const between = parent.children.slice(
      startIndex,
      endIndex > 0 ? endIndex : undefined
    );
  
    const section = {
      type: 'section',
      depth: depth,
      children: between,
      data: {
        hName: 'section'
      }
    };
  
    parent.children.splice(startIndex, section.children.length, section)
  }

  return (tree) => {
    if (options.flatten) {
      // 如果要拍平的结构，直接遍历即可
      visit(
        tree,
        node => node.type === 'heading',
        sectionize
      )
    } else {
      // 如果要嵌套的结构，需要从最深层依次向外遍历，才能把结构从里向外层层折叠起来
      for (let depth = options.max_depth; depth > 0; depth--) {
        visit(
          tree,
          node => node.type === 'heading' && node.depth === depth,
          sectionize
        )
      }
    }
  }
};

export default plugin;