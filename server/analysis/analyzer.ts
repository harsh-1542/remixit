import { validateAndNormalizeUrl } from '../security/url-validator';
import { verifyHostSafety } from '../security/ssrf-protection';
import { renderAndCaptureWebsite } from './playwright';
import { analyzeDomStructure } from './dom-analyzer';
import { detectTechnologies } from './technology-detector';
import { getVisionProvider } from '../ai/factory';
import { globalJobManager } from '../jobs/job-manager';
import { AnalysisJob } from '../types';

export async function startWebsiteAnalysis(rawUrl: string): Promise<{
  jobId: string;
  status: string;
  isCached?: boolean;
}> {
  // 1. URL syntax validation and normalization
  const validation = validateAndNormalizeUrl(rawUrl);
  if (!validation.isValid || !validation.normalizedUrl) {
    throw new Error(validation.error || "Please enter a valid website URL.");
  }

  const normalizedUrl = validation.normalizedUrl;

  // 2. SSRF check
  const parsed = new URL(normalizedUrl);
  const safety = await verifyHostSafety(parsed.hostname);
  if (!safety.safe) {
    throw new Error(safety.error || 'The requested URL cannot be accessed.');
  }

  // 3. Cache lookup
  const cachedJobId = globalJobManager.getCachedJobId(normalizedUrl);
  if (cachedJobId) {
    return { jobId: cachedJobId, status: 'completed', isCached: true };
  }

  // 4. Create new job
  const job = globalJobManager.createJob(rawUrl, normalizedUrl);

  // 5. Fire and run asynchronous analysis in background
  processAnalysisJob(job.id, normalizedUrl).catch((err) => {
    console.error(`[Analyzer] Background job ${job.id} failed:`, err);
  });

  return { jobId: job.id, status: job.status };
}

async function processAnalysisJob(jobId: string, targetUrl: string) {
  try {
    // Stage 1: Connecting
    globalJobManager.updateJob(jobId, {
      status: 'loading',
      progress: 25,
      currentStage: 'Connecting to website',
    });

    // Stage 2: Rendering and Capturing
    globalJobManager.updateJob(jobId, {
      status: 'capturing',
      progress: 45,
      currentStage: 'Capturing visual structure',
    });

    const renderResult = await renderAndCaptureWebsite(targetUrl);

    // Stage 3: DOM & Tech Extraction
    globalJobManager.updateJob(jobId, {
      status: 'extracting',
      progress: 65,
      currentStage: 'Analyzing layout',
      desktopScreenshot: renderResult.desktopScreenshot,
      mobileScreenshot: renderResult.mobileScreenshot,
      metadata: renderResult.metadata,
    });

    const sections = analyzeDomStructure(renderResult.html);
    const technologies = detectTechnologies(renderResult.html);

    // Stage 4: AI Vision Analysis
    globalJobManager.updateJob(jobId, {
      status: 'analyzing',
      progress: 85,
      currentStage: 'Understanding design system',
    });

    const visionProvider = getVisionProvider();
    const designSpec = await visionProvider.analyzeWebsite({
      url: targetUrl,
      metadata: renderResult.metadata,
      sections,
      technologies,
      desktopScreenshotBase64: renderResult.desktopScreenshot,
      mobileScreenshotBase64: renderResult.mobileScreenshot,
    });

    // Stage 5: Completed
    globalJobManager.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      currentStage: 'Preparing results',
      designSpec,
    });
  } catch (err: any) {
    const errorMsg = formatUserFriendlyError(err);
    globalJobManager.updateJob(jobId, {
      status: 'failed',
      progress: 100,
      currentStage: 'Analysis failed',
      error: errorMsg,
    });
  }
}

function formatUserFriendlyError(err: any): string {
  const msg = (err?.message || '').toLowerCase();
  if (msg.includes('dns') || msg.includes('unreachable') || msg.includes('enotfound')) {
    return "We couldn't reach this website. Check the URL and try again.";
  }
  if (msg.includes('timeout') || msg.includes('timed out')) {
    return 'The website took too long to respond.';
  }
  if (msg.includes('status 403') || msg.includes('status 401') || msg.includes('blocked')) {
    return "This website doesn't allow automated analysis.";
  }
  if (msg.includes('ai') || msg.includes('interpretation')) {
    return 'We analyzed the website, but the design interpretation failed. Try again.';
  }
  return err.message || 'We could not complete the reference analysis. Check the URL and try again.';
}
