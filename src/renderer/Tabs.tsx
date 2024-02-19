import * as React from 'react';
import {
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';

import classnames from 'classnames';
import { NavigateDirection, OpenTabArguments, UpdateTabTitleArguments } from '_/main/types';
import './tabs.css';
import 'bootstrap/dist/css/bootstrap.css';

const { backend } = window; // defined in preload.js

interface TabsProps {
    profile: string
}

interface TabDetails {
    tabNumber: string,
    title?: string
}

interface TabsState {
    tabs: Array<TabDetails>,
    activeTab?: string,
}

export default class Tabs extends React.Component<TabsProps, TabsState> {
  constructor(props: TabsProps) {
    super(props);

    this.state = {
      tabs: [],
    };
  }

  componentDidMount(): void {
    backend.register((args) => { this.openTab(args); }, (args) => { this.updateTabTitle(args); });
  }

  openTab({ tabNumber }: OpenTabArguments) {
    const { tabs } = this.state;
    this.setState({ tabs: tabs.concat({ tabNumber }), activeTab: tabNumber });
  }

  updateTabTitle({ tabNumber, title }: UpdateTabTitleArguments) {
    const { tabs } = this.state;
    const newTabs = tabs.map((tabDetails) => {
      if (tabDetails.tabNumber === tabNumber) {
        return { tabNumber, title };
      }
      return tabDetails;
    }).sort((left, right) => parseInt(left.tabNumber, 10) - parseInt(right.tabNumber, 10));
    this.setState({ tabs: newTabs });
  }

  toggle(tab: string) {
    const { activeTab } = this.state;
    const { profile } = this.props;
    if (activeTab !== tab) {
      this.setState({ activeTab: tab });
      backend.switchTab({ profile, tab });
    }
  }

  close(tab: string) {
    const { profile } = this.props;
    const { activeTab, tabs } = this.state;

    const index = tabs.findIndex((details) => details.tabNumber === tab);
    const newTabs = tabs.filter((details) => details.tabNumber !== tab);
    if (newTabs.length) {
      let newActiveTab = activeTab;
      if (activeTab === tab) {
        // closing the active tab
        newActiveTab = newTabs[Math.min(newTabs.length - 1, index)].tabNumber;
        this.toggle(newActiveTab);
      }
      this.setState({ activeTab: newActiveTab, tabs: newTabs });
    }
    backend.closeTab({ profile, tab });
  }

  navigate(direction: NavigateDirection) {
    const { profile } = this.props;
    const { activeTab } = this.state;

    backend.navigate({ direction, profile, tab: activeTab! });
  }

  render(): React.ReactElement {
    const { activeTab, tabs } = this.state;

    return (
      <Nav tabs>
        <NavItem>
          <NavLink
            className="tab"
            onClick={() => {
              this.navigate('backwards');
            }}
          >
            ◀
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink
            className="tab"
            onClick={() => {
              this.navigate('forwards');
            }}
          >
            ▶
          </NavLink>
        </NavItem>
        {tabs.map((tab) => (
          <NavItem key={tab.tabNumber} className={classnames('tab')}>
            <NavLink
              className={classnames('tab', { active: activeTab === tab.tabNumber })}
              onClick={() => { this.toggle(tab.tabNumber); }}
            >
              {tab.title}
              <span
                className={classnames('tabClose')}
                onClick={() => { this.close(tab.tabNumber); }}
                role="link"
                tabIndex={-1}
                onKeyDown={(event) => {
                  if (event.ctrlKey && event.key === 'w') {
                    event.preventDefault();
                    if (tab.tabNumber === activeTab) {
                      this.close(tab.tabNumber);
                    }
                  }
                }}
              >
                &#215;
              </span>
            </NavLink>
          </NavItem>
        ))}
      </Nav>
    );
  }
}
