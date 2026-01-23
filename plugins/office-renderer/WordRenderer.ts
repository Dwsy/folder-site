import { renderAsync } from 'docx-preview';

export default class WordRenderer {
  private supportedFormats = ['docx'];

  /**
   * 渲染 Word 文件为 HTML 格式
   * @param file - 文件对象
   * @param container - 渲染容器元素
   * @returns Promise<void>
   */
  async render(file: File, container?: HTMLElement): Promise<string> {
    const buffer = await file.arrayBuffer();

    if (container) {
      // 如果提供容器，直接渲染到容器中
      await renderAsync(buffer, container);
      return container.innerHTML;
    } else {
      // 创建临时容器用于渲染
      const tempContainer = document.createElement('div');
      await renderAsync(buffer, tempContainer);
      return tempContainer.innerHTML;
    }
  }

  /**
   * 检查文件格式是否支持
   */
  supports(format: string): boolean {
    return this.supportedFormats.includes(format.toLowerCase());
  }
}
