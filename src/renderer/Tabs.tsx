import * as React from 'react';
import {
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.css';
import classnames from 'classnames';
import { OpenTabArguments } from '_/main/types';

const { backend } = window; // defined in preload.js

interface TabsProps {
    profile: string
}

interface TabsState {
    tabs: Array<string>,
    activeTab: string,
}

export default class Tabs extends React.Component<TabsProps, TabsState> {
  constructor(props: TabsProps) {
    super(props);

    this.state = {
      tabs: [],
      activeTab: '1',
    };
  }

  componentDidMount(): void {
    backend.register((args: OpenTabArguments) => {
      const { tabs } = this.state;
      this.setState({ tabs: tabs.concat(args.tabNumber), activeTab: args.tabNumber });
    });
  }

  toggle(tab: string) {
    const { activeTab } = this.state;
    const { profile } = this.props;
    if (activeTab !== tab) {
      this.setState({ activeTab: tab });
      backend.switchTab({ profile, tab });
    }
  }

  render(): React.ReactElement {
    const { activeTab, tabs } = this.state;
    const { profile } = this.props;

    return (
      <Nav tabs>
        {tabs.map((tab) => (
          <NavItem key={tab}>
            <NavLink
              className={classnames({ active: activeTab === tab })}
              onClick={() => { this.toggle(tab); }}
            >
              Tab
              {' '}
              {tab}
              {' '}
              -
              {' '}
              {profile}
            </NavLink>
          </NavItem>
        ))}

      </Nav>
    );
  }
}
