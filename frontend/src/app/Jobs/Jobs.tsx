/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useContext, useEffect, useState } from 'react';
import { ContextSelector, ContextSelectorItem, PageSection, TextContent } from '@patternfly/react-core';
import { Context } from '@app/store/store';
import { getRepositories, getWorkflowByRepositoryName } from '@app/utils/APIService';
import { Caption, TableComposable, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { ReactReduxContext, useSelector } from 'react-redux';

interface Repository {
  git_organization: string;
  repository_name: string;
  git_url: string
  description: string
}

interface Workflows {
  workflow_name: string;
  badge_url: string;
  job: string;
  html_url: string
}

const columnNames = {
  name: 'Name',
  html_url: 'Job URL',
  job: 'Job State',
  badge: 'Last Execution'
};


export const JobsComponent: React.FunctionComponent = () => {
  const [isOpen, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const { store } = useContext(ReactReduxContext);
  const state = store.getState();
  const dispatch = store.dispatch;

  const [workflows, setWorkflows] = useState([]);

  const [repositories, setallreps] = useState<any>(state.repos.Allrepositories);

  const [, setFilteredItems] = useState(repositories);
  const [repos, setRepositories] = useState([]);

  const currentTeam = useSelector((state: any) => state.teams.Team);
  
  useEffect(() => {
    clearAll()
    getRepositories(5, state.teams.Team).then((res) => {
      if (res.code === 200) {
        const result = res.data;
        setallreps(res.all)
        dispatch({ type: "SET_REPOSITORIES", data: result });
        dispatch({ type: "SET_REPOSITORIES_ALL", data: res.all });
      } else {
        dispatch({ type: "SET_ERROR", data: res });
        clearAll()
      }
    });
  }, [repos, setRepositories, dispatch, state.teams.Team, currentTeam])


  function onToggle(_event: any, isOpen: boolean) {
    setOpen(isOpen);
  }

  function clearAll() {
    setWorkflows([])
    setSearchValue('')
    setSelected('default')
  }

  function getworkflows(repo) {
    getWorkflowByRepositoryName(repo).then((res) => {
      if (res.code === 200) {
        const result = res.data;
        setWorkflows(result)
        dispatch({ type: "SET_WORKFLOWS", data: result });
      } else {
        dispatch({ type: "SET_ERROR", data: res });
      }
    });
  }

  function onSelect(_event: any, value: string) {
    setSelected(value);
    setOpen(!isOpen);
    getworkflows(value);
  }

  function onSearchInputChange(value: string) {
    setSearchValue(value);
  }

  function onSearchButtonClick() {
    const filtered =
      searchValue === ''
        ? repositories
        : repositories.filter(item => {
          const str = (typeof item.repository_name === 'string') ? item.repository_name : item.repository_name;
          return str.toLowerCase().indexOf(searchValue.toLowerCase()) !== -1;
        });

    setFilteredItems(filtered || []);
  }

  let firstItemText = "default"
  const [selected, setSelected] = useState(firstItemText);

  if (typeof repositories[0] !== 'undefined') {
    firstItemText = repositories[0].repository_name
  }

  return (
    <PageSection>
      <div style={{ backgroundColor: "white", paddingTop: "5px" }}>
        <div style={{ padding: "10px" }}>
          <ContextSelector
            toggleText={selected}
            onSearchInputChange={onSearchInputChange}
            isOpen={isOpen}
            searchInputValue={searchValue}
            onToggle={onToggle}
            onSelect={onSelect}
            onSearchButtonClick={onSearchButtonClick}
            screenReaderLabel="Selected Project:"
            isPlain
            isText
          >
            {repositories.map((item, index) => {
              const [text] = (typeof item === 'string')
                ? [item]
                : [item];
              return <ContextSelectorItem key={index}>{text.repository_name}</ContextSelectorItem>;
            })}
          </ContextSelector>
        </div>
        <hr />
        <TableComposable aria-label="Actions table" style={{ padding: "10px" }}>
          <Caption>All Github Actions available in the repository {selected}</Caption>
          <Thead>
            <Tr>
              <Th>{columnNames.name}</Th>
              <Th>{columnNames.job}</Th>
              <Th>{columnNames.badge}</Th>
              <Th>{columnNames.html_url}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {workflows.map(workf => {
              const workflow: Workflows = workf
              return (
                <Tr key={workflow.workflow_name || ""}>
                  <Td dataLabel={columnNames.name}>{workflow.workflow_name || ""}</Td>
                  <Td dataLabel={columnNames.job}>{workflow.job || ""}</Td>
                  <Td dataLabel={columnNames.badge}><img src={workflow.badge_url}></img></Td>
                  <Td dataLabel={columnNames.html_url}><a href={workflow.html_url}><ExternalLinkAltIcon>Link</ExternalLinkAltIcon>Go to job</a></Td>
                </Tr>
              );
            })}
          </Tbody>
        </TableComposable>
      </div>
    </PageSection>

  );
};