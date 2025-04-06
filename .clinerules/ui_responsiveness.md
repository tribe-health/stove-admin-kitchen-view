# .clinerules - Instant UI Responsiveness Enforcement

# Rule Set: Perceived Performance - Rules to ensure the UI feels instantly responsive 
# even when waiting for backend operations

rules:
  # ======== 1. INSTANT FEEDBACK ========
  - id: optimistic-ui-updates
    name: "Enforce optimistic UI updates"
    description: "Ensure UI state updates happen before API calls complete"
    pattern: |
      function $ACTION_HANDLER() {
        $API_CALL()
          .then(() => {
            $UPDATE_STATE()
          })
      }
    message: "PERCEIVED SLOWNESS: Update UI state before API call, not after. Change to: setState() first, then make API call."
    severity: error
    
  - id: missing-loading-state
    name: "Enforce loading state usage"
    description: "Ensure loading states are used for async operations"
    pattern: |
      function $COMPONENT() {
        const $ACTION = async () => {
          await $API_CALL()
          $NO_LOADING_STATE
        }
      }
    message: "PERCEIVED SLOWNESS: Missing loading state management. Add setLoading(true) before API call and setLoading(false) after."
    severity: warning

  # ======== 2. AVOID LAYOUT SHIFTS ========
  - id: missing-image-dimensions
    name: "Enforce image dimensions"
    description: "Ensure images have width and height attributes to prevent layout shifts"
    patterns:
      - '<img src="$SRC" $NO_WIDTH $NO_HEIGHT'
      - '<Image src="$SRC" $NO_WIDTH $NO_HEIGHT'
    message: "CLS ISSUE: Image missing explicit width/height. This causes layout shifts when images load."
    severity: error
    
  - id: nextjs-image-without-sizes
    name: "Enforce Next.js Image sizes attribute"
    description: "Ensure Next.js Image components have sizes attribute for responsive images"
    pattern: |
      <Image
        src="$SRC"
        fill
        $NO_SIZES
      />
    message: "CLS ISSUE: Next.js Image with 'fill' prop missing 'sizes' attribute. This can cause layout shifts."
    severity: error
    
  - id: dynamic-content-without-placeholder
    name: "Enforce placeholders for dynamic content"
    description: "Ensure dynamic content has placeholder or skeleton loaders"
    pattern: |
      {$LOADING ? null : <$CONTENT />}
    message: "CLS ISSUE: Replace 'null' with a skeleton or placeholder of the same dimensions."
    severity: error
    
  # ======== 3. SKELETON LOADERS ========
  - id: missing-skeleton-loader
    name: "Enforce skeleton loader usage"
    description: "Ensure skeleton loaders are used during data fetching"
    pattern: |
      {$IS_LOADING && <$SPINNER />}
    message: "UX IMPROVEMENT: Replace generic spinner with skeleton loader that matches content shape."
    severity: warning
    
  - id: empty-data-container
    name: "Prevent empty containers during loading"
    description: "Ensure containers have skeleton content during loading"
    pattern: |
      <div className="$CONTAINER">
        {$DATA && $DATA.map($ITEM => (
          <$COMPONENT key={$KEY} />
        ))}
      </div>
    message: "UX IMPROVEMENT: Add skeleton loader when $DATA is null/undefined."
    severity: warning
    
  - id: shadcn-skeleton-missing
    name: "Enforce shadcn/ui Skeleton usage"
    description: "Ensure shadcn/ui Skeleton component is used during data loading"
    pattern: |
      import { $COMPONENTS } from "@/components/ui";
      
      // Later in component
      {$IS_LOADING && <div className="animate-pulse">$CONTENT</div>}
    message: "UX IMPROVEMENT: Use shadcn/ui Skeleton component instead of custom animate-pulse solution."
    severity: info
    
  - id: missing-skeleton-with-suspense
    name: "Enforce skeletons with React Suspense"
    description: "Ensure Suspense boundaries have fallbacks with skeleton loaders"
    pattern: |
      <Suspense fallback={<div>Loading...</div>}>
        <$COMPONENT />
      </Suspense>
    message: "UX IMPROVEMENT: Use skeleton loaders in Suspense fallback instead of generic loading text."
    severity: warning
    
  - id: shadcn-skeleton-array-rendering
    name: "Enforce proper array skeleton rendering"
    description: "Ensure arrays of items use array-based skeleton loaders"
    pattern: |
      {$ITEMS ? (
        $ITEMS.map(($ITEM) => <$COMPONENT key={$ITEM.$ID} />)
      ) : (
        <p>Loading...</p>
      )}
    message: "UX IMPROVEMENT: Use Array.from({length: N}) with Skeleton components instead of loading text."
    severity: warning
    
  - id: zustand-missing-loading-state
    name: "Enforce loading state in Zustand stores"
    description: "Ensure Zustand stores track loading states for async operations"
    pattern: |
      create(($SET) => ({
        $FETCH_DATA: async () => {
          const response = await $API_CALL()
          $SET({ $DATA: response.$DATA })
        }
      }))
    message: "UX IMPROVEMENT: Add isLoading state to Zustand store for async operations."
    severity: warning
    
  # ======== 4. DEBOUNCE/THROTTLE ========
  - id: missing-debounce
    name: "Enforce debounce on input handlers"
    description: "Ensure input handlers are debounced to prevent excessive updates"
    pattern: |
      onChange={($EVENT) => {
        $UPDATE_STATE($EVENT.target.value)
      }}
    message: "PERFORMANCE: Debounce this input handler to prevent excessive renders."
    severity: warning
    
  - id: missing-throttle-scroll
    name: "Enforce throttle on scroll handlers"
    description: "Ensure scroll handlers are throttled"
    pattern: |
      onScroll={($EVENT) => {
        $HANDLE_SCROLL()
      }}
    message: "PERFORMANCE: Throttle this scroll handler to prevent jank."
    severity: warning
    
  - id: missing-lodash-import-debounce
    name: "Enforce lodash debounce usage"
    description: "Ensure lodash debounce is used for debouncing functions"
    pattern: |
      // No import of debounce from lodash
      // Later in code
      const handleChange = ($EVENT) => {
        $SET_STATE($EVENT.target.value)
      }
    message: "PERFORMANCE: Use lodash debounce for input handlers to improve responsiveness."
    severity: info
    
  # ======== 5. MICRO-INTERACTIONS ========
  - id: missing-button-feedback
    name: "Enforce button feedback"
    description: "Ensure buttons have visual feedback on interaction"
    pattern: |
      <button $NO_ACTIVE_CLASS onClick={$HANDLER}>$CONTENT</button>
    message: "UX IMPROVEMENT: Add active/hover state or transform effect for button feedback."
    severity: info
    
  - id: missing-transition
    name: "Enforce CSS transitions"
    description: "Ensure interactive elements have smooth transitions"
    pattern: |
      $ELEMENT:hover {
        $PROPERTY: $VALUE;
        $NO_TRANSITION
      }
    message: "UX IMPROVEMENT: Add 'transition' property for smoother state changes."
    severity: info
    
  - id: tailwind-transform-scale-feedback
    name: "Enforce Tailwind transform feedback"
    description: "Ensure interactive elements use Tailwind scale transforms for feedback"
    pattern: |
      <button 
        className="$CLASSES" 
        $NO_ACTIVE_SCALE
        onClick={$HANDLER}
      >
        $CONTENT
      </button>
    message: "UX IMPROVEMENT: Add 'active:scale-95' class for button press feedback."
    severity: info
    
  - id: shadcn-missing-hover-effect
    name: "Enforce hover effects on shadcn/ui components"
    description: "Ensure shadcn/ui components have hover effects"
    pattern: |
      <Button
        $NO_VARIANT
        onClick={$HANDLER}
      >
        $CONTENT
      </Button>
    message: "UX IMPROVEMENT: Add variant to Button component for proper hover effects."
    severity: info

  # ======== 6. ASYNC OPERATIONS ========
  - id: blocking-main-thread
    name: "Prevent blocking the main thread"
    description: "Ensure heavy operations don't block the main thread"
    pattern: |
      function $HANDLER() {
        for ($INIT; $CONDITION; $INCREMENT) {
          $HEAVY_COMPUTATION
        }
        $UPDATE_UI
      }
    message: "PERFORMANCE: Move heavy computation off the main thread using Web Workers or chunk the work."
    severity: warning
    
  - id: missing-error-handling
    name: "Enforce error handling in async operations"
    description: "Ensure all async operations have proper error handling"
    pattern: |
      $API_CALL()
        .then($SUCCESS_HANDLER)
    message: "RELIABILITY: Add .catch() handler to gracefully handle errors and revert optimistic updates."
    severity: error
    
  - id: missing-error-state-in-ui
    name: "Enforce error states in UI"
    description: "Ensure error states are shown in UI when operations fail"
    pattern: |
      const [$DATA, $SET_DATA] = useState();
      const [$LOADING, $SET_LOADING] = useState(false);
      // No error state defined
    message: "UX IMPROVEMENT: Add error state to handle failed operations gracefully in UI."
    severity: warning
    
  - id: react-query-missing-suspense
    name: "Enforce React Query with Suspense"
    description: "Ensure React Query uses Suspense for loading states"
    pattern: |
      const { data, isLoading } = useQuery($QUERY_KEY, $FETCH_FN);
      
      if (isLoading) {
        return <$LOADING_COMPONENT />;
      }
    message: "UX IMPROVEMENT: Use suspense: true with React Query to leverage React Suspense instead of manual loading checks."
    severity: info
    
  - id: swr-missing-suspense
    name: "Enforce SWR with Suspense"
    description: "Ensure SWR uses Suspense for loading states"
    pattern: |
      const { data, error } = useSWR($KEY, $FETCHER);
      
      if (!data) {
        return <$LOADING_COMPONENT />;
      }
    message: "UX IMPROVEMENT: Use suspense: true with SWR to leverage React Suspense instead of manual loading checks."
    severity: info

  # ======== 7. RENDER OPTIMIZATION ========
  - id: missing-memo
    name: "Enforce React.memo for pure components"
    description: "Ensure pure components are memoized to prevent unnecessary renders"
    pattern: |
      function $COMPONENT($PROPS) {
        return (
          $JSX
        );
      }
      
      export default $COMPONENT;
    message: "PERFORMANCE: Wrap pure component with React.memo() to prevent unnecessary re-renders."
    severity: info
    
  - id: virtual-list-for-large-data
    name: "Enforce virtual lists for large datasets"
    description: "Ensure large datasets use virtualized lists"
    pattern: |
      {$ITEMS.length > 100 && $ITEMS.map(($ITEM) => (
        <$COMPONENT key={$ITEM.$ID} />
      ))}
    message: "PERFORMANCE: Use react-window or react-virtualized for large lists to improve rendering performance."
    severity: warning

# Configuration settings
settings:
  fix_suggestions: true
  include_patterns:
    - "**/*.jsx"
    - "**/*.tsx"
    - "**/*.js"
    - "**/*.ts"
    - "**/*.css"
    - "**/*.scss"
  exclude_patterns:
    - "node_modules/**"
    - "build/**"
    - "dist/**"