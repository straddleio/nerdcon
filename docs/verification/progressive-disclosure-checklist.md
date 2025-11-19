# Progressive Disclosure Verification Checklist

## Functionality

- [ ] Empty state shows all cards empty (maintains existing UX)
- [ ] Customer creation populates CustomerCard
- [ ] Paykey creation shows 60/40 split (Customer 60%, Paykey 40%)
- [ ] Charge creation shows 50/50 split with embedded paykey
- [ ] Green key icon shows paykey details when clicked
- [ ] Charge scheduled shows circular tracker with embedded paykey access
- [ ] Backward navigation (removing resources) reverses states correctly

## Visual Design

- [ ] Dark theme: Neon glow on cards, green key pulse
- [ ] Light theme: Clean Ayu aesthetic, refined shadows
- [ ] 60/40 grid split renders correctly
- [ ] 50/50 grid split renders correctly
- [ ] Embedded paykey expandable section animates smoothly
- [ ] Circular tracker progress ring animates correctly
- [ ] No layout shift during transitions

## Interactions

- [ ] Green key icon expands/collapses paykey details
- [ ] Payment method button in tracker expands paykey info
- [ ] Hover effects work on all cards
- [ ] Progress percentage updates correctly
- [ ] Status icon animates (pulse on paid, bounce on pending)

## Accessibility

- [ ] Reduced-motion preferences respected
- [ ] ARIA labels on toggle buttons
- [ ] Keyboard navigation works
- [ ] Screen reader announces layout changes

## Performance

- [ ] No console errors during transitions
- [ ] Animations run at 60fps
- [ ] No memory leaks on state changes
- [ ] Production build size increase < 15KB

## Tests

- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] State selector tests pass
- [ ] Coverage maintained above 50%
