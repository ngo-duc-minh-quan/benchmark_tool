export const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  return "http://localhost:3000";
};

export const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  // If url is relative, prepend baseUrl. If it's absolute, use it directly.
  const isAbsolute = url.startsWith("http://") || url.startsWith("https://");
  const fetchUrl = isAbsolute ? url : `${getBaseUrl()}${url}`;

  try {
    const response = await fetch(fetchUrl, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
