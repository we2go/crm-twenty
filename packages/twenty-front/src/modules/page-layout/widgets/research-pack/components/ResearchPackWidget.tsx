import { type PageLayoutWidget } from '@/page-layout/types/PageLayoutWidget';
import { useLayoutRenderingContext } from '@/ui/layout/contexts/LayoutRenderingContext';
import { SidePanelProvider } from '@/ui/layout/side-panel/contexts/SidePanelContext';
import { styled } from '@linaria/react';

import { ResearchPackCard } from './ResearchPackCard';

const StyledContainer = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

type ResearchPackWidgetProps = {
  widget: PageLayoutWidget;
};

export const ResearchPackWidget = ({
  widget: _widget,
}: ResearchPackWidgetProps) => {
  const { isInSidePanel } = useLayoutRenderingContext();

  return (
    <SidePanelProvider value={{ isInSidePanel }}>
      <StyledContainer>
        <ResearchPackCard />
      </StyledContainer>
    </SidePanelProvider>
  );
};
