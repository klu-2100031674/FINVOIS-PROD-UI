import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { emailKeys, listSelectedEmails, type EmailColumn, type EmailFolder, type ListParams } from '~/api/emailAutomation';
import { apiErrorMessage } from '~/utils/errors';
import { Notice } from './Notice';
import { PageControls } from './PageControls';

const PAGE_SIZE = 10;

/** The unique emails a send to these folders would reach. */
export function SelectedEmails({ folderIds, folders, columns }: { folderIds: string[]; folders: EmailFolder[]; columns: EmailColumn[] }) {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const idsKey = folderIds.join(',');
  const [lastIds, setLastIds] = useState(idsKey);
  if (idsKey !== lastIds) {
    setLastIds(idsKey);
    setPage(1);
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const params: ListParams = { page, limit: PAGE_SIZE, search: query };
  const list = useQuery({
    queryKey: emailKeys.selected(folderIds, params),
    queryFn: () => listSelectedEmails(folderIds, params),
    placeholderData: keepPreviousData,
  });
  const names = Object.fromEntries(folders.map((f) => [f._id, f.name]));
  const shown = columns.filter((c) => c.key !== 'email');

  return (
    <View testID="selected-emails" className="gap-2 border-t border-gray-100 pt-3">
      <Text className="text-sm font-medium text-gray-700">Selected emails</Text>
      <Input
        testID="selected-search"
        value={search}
        onChangeText={setSearch}
        placeholder="Search email, bank, region"
        autoCapitalize="none"
        autoCorrect={false}
        className="h-11 rounded-xl"
      />
      {list.isError && !list.data ? <Notice tone="error" testID="selected-error">{apiErrorMessage(list.error, "Couldn't load the selected emails.")}</Notice> : null}
      {list.data ? (
        <>
          {list.data.contacts.length === 0 ? <Text className="py-3 text-center text-gray-500">{query ? 'No matching emails' : 'No emails'}</Text> : null}
          {list.data.contacts.map((c) => (
            <View key={c.email} testID={`selected-${c.email}`} className="gap-0.5 rounded-xl border border-gray-100 bg-gray-50 p-3">
              <Text className="text-sm font-medium text-gray-900" numberOfLines={1}>{c.email}</Text>
              {shown.map((col) =>
                c.data?.[col.key] ? (
                  <Text key={col.key} className="text-xs text-gray-600" numberOfLines={1}>{col.label}: {c.data[col.key]}</Text>
                ) : null
              )}
              <Text className="text-xs text-gray-500" numberOfLines={1}>{(c.folders ?? []).map((id) => names[id]).filter(Boolean).join(', ')}</Text>
            </View>
          ))}
          <PageControls pagination={list.data.pagination} noun="unique email" onPage={setPage} testID="selected" />
        </>
      ) : null}
    </View>
  );
}
