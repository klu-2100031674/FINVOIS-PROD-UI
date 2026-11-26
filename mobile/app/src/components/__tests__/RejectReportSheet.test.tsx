import { fireEvent, render, screen } from '@testing-library/react-native';
import { RejectReportSheet } from '../RejectReportSheet';

// The first render loads the whole component library, which can take longer than 5 s on a busy machine.
jest.setTimeout(30000);
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const renderSheet = async (props: Partial<React.ComponentProps<typeof RejectReportSheet>> = {}) => {
  const onSubmit = jest.fn();
  const onClose = jest.fn();
  await render(<RejectReportSheet visible onClose={onClose} onSubmit={onSubmit} pending={false} {...props} />);
  return { onSubmit, onClose };
};

describe('RejectReportSheet', () => {
  it('cannot be submitted without a reason of at least 5 characters', async () => {
    const { onSubmit } = await renderSheet();
    const confirm = screen.getByTestId('reject-confirm');
    expect(confirm).toBeDisabled();

    await fireEvent.changeText(screen.getByTestId('reject-reason'), '  abcd ');
    expect(screen.getByTestId('reject-confirm')).toBeDisabled();
    expect(screen.getByTestId('reject-reason-hint')).toHaveTextContent('Enter at least 5 characters.');
    await fireEvent.press(screen.getByTestId('reject-confirm'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the trimmed reason once it is long enough', async () => {
    const { onSubmit } = await renderSheet();
    await fireEvent.changeText(screen.getByTestId('reject-reason'), '  Missing bank statements  ');
    expect(screen.getByTestId('reject-confirm')).toBeEnabled();
    await fireEvent.press(screen.getByTestId('reject-confirm'));
    expect(onSubmit).toHaveBeenCalledWith({ rejection_reason: 'Missing bank statements', send_email: true });
  });

  it('disables everything while the request is pending and shows the server message on failure', async () => {
    const { onClose } = await renderSheet({ pending: true, error: 'Report cannot be rejected in current status' });
    await fireEvent.changeText(screen.getByTestId('reject-reason'), 'Missing bank statements');
    expect(screen.getByTestId('reject-confirm')).toBeDisabled();
    expect(screen.getByTestId('reject-cancel')).toBeDisabled();
    expect(screen.getByTestId('reject-error')).toHaveTextContent('Report cannot be rejected in current status');
    await fireEvent.press(screen.getByTestId('reject-cancel'));
    expect(onClose).not.toHaveBeenCalled();
  });
});
