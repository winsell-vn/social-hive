import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
} from "@nestjs/common";
import { Response } from "express";
import { SitemapService } from "../services/sitemap.service";
import { Public } from "../../../common/decorators/public.decorator";

@Controller()
export class SitemapController {
  constructor(private sitemapService: SitemapService) {}

  /**
   * Helper to send XML response directly, bypassing TransformInterceptor.
   * Using @Res() ensures raw XML is returned without JSON wrapping.
   */
  private sendXml(res: Response, xml: string, cacheMaxAge: number = 3600): void {
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", `public, max-age=${cacheMaxAge}`);
    res.send(xml);
  }

  @Get("sitemap.xml")
  @Public()
  async getSitemapIndex(@Res() res: Response): Promise<void> {
    const xml = await this.sitemapService.generateSitemapIndex();
    this.sendXml(res, xml, 3600);
  }

  // Paginated posts sitemap: /sitemap/posts-1.xml, /sitemap/posts-2.xml, etc.
  @Get("sitemap/posts-:page.xml")
  @Public()
  async getPostsSitemapPaginated(
    @Param("page") page: string,
    @Res() res: Response,
  ): Promise<void> {
    const pageNum = this.validatePage(page);
    const xml = await this.sitemapService.generatePostsSitemap(pageNum);
    this.sendXml(res, xml, 3600);
  }

  // Paginated users sitemap: /sitemap/users-1.xml, /sitemap/users-2.xml, etc.
  @Get("sitemap/users-:page.xml")
  @Public()
  async getUsersSitemapPaginated(
    @Param("page") page: string,
    @Res() res: Response,
  ): Promise<void> {
    const pageNum = this.validatePage(page);
    const xml = await this.sitemapService.generateUsersSitemap(pageNum);
    this.sendXml(res, xml, 3600);
  }

  // Paginated hashtags sitemap: /sitemap/hashtags-1.xml, /sitemap/hashtags-2.xml, etc.
  @Get("sitemap/hashtags-:page.xml")
  @Public()
  async getHashtagsSitemapPaginated(
    @Param("page") page: string,
    @Res() res: Response,
  ): Promise<void> {
    const pageNum = this.validatePage(page);
    const xml = await this.sitemapService.generateHashtagsSitemap(pageNum);
    this.sendXml(res, xml, 3600);
  }

  @Get("sitemap/static.xml")
  @Public()
  async getStaticPagesSitemap(@Res() res: Response): Promise<void> {
    const xml = await this.sitemapService.generateStaticPagesSitemap();
    this.sendXml(res, xml, 86400);
  }

  // Paginated blog sitemap: /sitemap/blog-1.xml, /sitemap/blog-2.xml, etc.
  @Get("sitemap/blog-:page.xml")
  @Public()
  async getBlogSitemapPaginated(
    @Param("page") page: string,
    @Res() res: Response,
  ): Promise<void> {
    const pageNum = this.validatePage(page);
    const xml = await this.sitemapService.generateBlogSitemap(pageNum);
    this.sendXml(res, xml, 3600);
  }

  // Paginated images sitemap: /sitemap/images-1.xml, /sitemap/images-2.xml, etc.
  @Get("sitemap/images-:page.xml")
  @Public()
  async getImagesSitemapPaginated(
    @Param("page") page: string,
    @Res() res: Response,
  ): Promise<void> {
    const pageNum = this.validatePage(page);
    const xml = await this.sitemapService.generateImageSitemap(pageNum);
    this.sendXml(res, xml, 3600);
  }

  /**
   * Validate and parse page parameter.
   * Returns page number if valid, throws NotFoundException if invalid.
   */
  private validatePage(page: string): number {
    const pageNum = parseInt(page, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      throw new NotFoundException("Invalid sitemap page");
    }
    return pageNum;
  }
}
