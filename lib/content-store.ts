import { ContentDocument } from '@/lib/content-contract';

/**
 * In-memory store for ContentDocument. Replace with DB in production.
 */
class ContentStore {
  private docs: Map<string, ContentDocument> = new Map();
  private courseToContent: Map<string, string> = new Map();

  public save(doc: ContentDocument): void {
    this.docs.set(doc.content_id, doc);
  }

  public get(contentId: string): ContentDocument | undefined {
    return this.docs.get(contentId);
  }

  public linkCourse(courseId: string, contentId: string): void {
    this.courseToContent.set(courseId, contentId);
  }

  public getByCourseId(courseId: string): ContentDocument | undefined {
    const cid = this.courseToContent.get(courseId);
    return cid ? this.docs.get(cid) : undefined;
  }
}
// Ensure singleton across route modules/process reloads in dev
const g = globalThis as unknown as { __contentStore?: ContentStore };
export const contentStore =
  g.__contentStore ?? (g.__contentStore = new ContentStore());
