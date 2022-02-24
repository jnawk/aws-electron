import * as React from 'react';
import { Button } from 'reactstrap';
import { LaunchButtonGeneratorArguments, LaunchButton } from '_/main/types';

function mfaAwareButtonGenerator(defaultText: string, {
  launchProfile, shouldDisable,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return function buttonGenerator(buttonText?: string) {
    return (
      <Button
        onClick={launchProfile}
        disabled={shouldDisable}
        title={shouldDisable ? 'Enter your 6-digit MFA code first!' : undefined}
      >
        {buttonText || defaultText}
      </Button>
    );
  };
}

export function launchButtonGenerator({
  launchProfile, shouldDisable,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return mfaAwareButtonGenerator('Launch', { launchProfile, shouldDisable });
}

export function mfaButtonGenerator({
  launchProfile, shouldDisable,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return mfaAwareButtonGenerator('MFA', { launchProfile, shouldDisable });
}
