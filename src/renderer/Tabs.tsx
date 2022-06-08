import * as React from 'react';
import {
//   TabContent,
//   TabPane,
  Nav,
  NavItem,
  NavLink,
//   Card,
//   Button,
//   CardTitle,
//   CardText,
//   Row,
//   Col,
} from 'reactstrap';

import 'bootstrap/dist/css/bootstrap.css';
import classnames from 'classnames';
import { OpenTabArguments } from '_/main/types';

const { backend } = window; // defined in preload.js

interface TabsProps {
    profile: string
}

interface TabsState {
    activeTab: string,
}

export default class Tabs extends React.Component<TabsProps, TabsState> {
  constructor(props: TabsProps) {
    super(props);

    this.state = {
      activeTab: '1',
    };
  }

  componentDidMount(): void {
    // const { profile } = this.props;
    backend.register((args: OpenTabArguments) => {
      console.log(args);
    });
  }

  toggle(tab: string) {
    const { activeTab } = this.state;
    const { profile } = this.props;
    if (activeTab !== tab) {
      this.setState({ activeTab: tab });
    }
    backend.switchTab({ profile, tab });
  }

  render(): React.ReactElement {
    const { activeTab } = this.state;
    const { profile } = this.props;
    return (
      <>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === '1' })}
              onClick={() => { this.toggle('1'); }}
            >
              Tab1 -
              {' '}
              {profile}
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: activeTab === '2' })}
              onClick={() => { this.toggle('2'); }}
            >
              Moar Tabs
            </NavLink>
          </NavItem>
        </Nav>
        {/* <TabContent activeTab={activeTab}>
            <TabPane tabId="1">
                <Row>
                <Col sm="12">
                    <h4>Tab 1 Contents</h4>
                </Col>
                </Row>
            </TabPane>
            <TabPane tabId="2">
                <Row>
                <Col sm="6">
                    <Card body>
                    <CardTitle>Special Title Treatment</CardTitle>
                    <CardText>With supporting text below as a natural lead-in to additional content.</CardText>
                    <Button>Go somewhere</Button>
                    </Card>
                </Col>
                <Col sm="6">
                    <Card body>
                    <CardTitle>Special Title Treatment</CardTitle>
                    <CardText>With supporting text below as a natural lead-in to additional content.</CardText>
                    <Button>Go somewhere</Button>
                    </Card>
                </Col>
                </Row>
            </TabPane>
            </TabContent> */}
      </>
    );
  }
}
