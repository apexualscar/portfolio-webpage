/**
 * Lightweight module-level state shared between the React tree outside the
 * R3F Canvas (e.g. GalleryScene) and components inside the Canvas (e.g.
 * shader materials) that cannot easily receive React props or context across
 * the Canvas renderer boundary.
 *
 * Values are written by GalleryScene via useEffect and read by shader
 * components in useFrame — no reactivity needed, just current truth.
 */
export const galleryState = {
  /** True while the zoom-into-painting animation is playing or the project
   *  page is being navigated to.  Shader materials pause time accumulation
   *  during this window so they resume seamlessly on return. */
  isZooming: false,
};
