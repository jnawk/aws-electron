import * as React from 'react';
import { Button } from 'reactstrap';
import { LaunchButtonGeneratorArguments, LaunchButton } from '_/main/types';

function mfaAwareButtonGenerator(defaultText: string, {
  launchProfile, shouldDisable, wasExpired,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return function buttonGenerator(buttonText?: string) {
    const color = wasExpired === true ? 'danger' : undefined;

    return (
      <Button
        onClick={launchProfile}
        disabled={shouldDisable}
        color={color}
        title={shouldDisable ? 'Enter your 6-digit MFA code first!' : undefined}
      >
        {buttonText || defaultText}
      </Button>
    );
  };
}

export function launchButtonGenerator({
  launchProfile, shouldDisable, wasExpired,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return mfaAwareButtonGenerator('Launch', { launchProfile, shouldDisable, wasExpired });
}

export function mfaButtonGenerator({
  launchProfile, shouldDisable,
}: LaunchButtonGeneratorArguments): LaunchButton {
  return mfaAwareButtonGenerator('MFA', { launchProfile, shouldDisable });
}
