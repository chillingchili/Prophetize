import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Select } from '../ui/select';

type MarketOption = {
  id: number;
  name: string;
};

type DueMarket = {
  id: number;
  title: string;
  end_date?: string;
  options?: MarketOption[];
};

type ResolvePayload = {
  resolved_option_id: number;
  resolution_evidence_url: string;
  resolution_note: string;
};

type Props = {
  rows: DueMarket[];
  onResolve: (marketId: number, payload: ResolvePayload) => void;
};

export const DueResolutionTable = ({ rows, onResolve }: Props) => {
  const [drafts, setDrafts] = useState<Record<number, ResolvePayload>>({});

  const updateDraft = (marketId: number, key: keyof ResolvePayload, value: string) => {
    setDrafts((current) => ({
      ...current,
      [marketId]: {
        resolved_option_id: current[marketId]?.resolved_option_id ?? 1,
        resolution_evidence_url: current[marketId]?.resolution_evidence_url ?? '',
        resolution_note: current[marketId]?.resolution_note ?? '',
        [key]: key === 'resolved_option_id' ? Number(value) : value,
      },
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Due For Resolution</CardTitle>
      </CardHeader>
      <CardContent>
      <table className="table">
        <thead>
          <tr>
            <th>Market</th>
            <th>Due</th>
            <th>Resolve</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={3}>No markets due for resolution.</td>
            </tr>
          ) : (
            rows.map((row) => {
              const options = row.options || [];
              const draft = drafts[row.id] ?? {
                resolved_option_id: options[0]?.id ?? 1,
                resolution_evidence_url: '',
                resolution_note: '',
              };

              return (
                <tr key={row.id}>
                  <td>{row.title}</td>
                  <td>{row.end_date ? new Date(row.end_date).toLocaleString() : '--'}</td>
                  <td>
                    <Select
                      value={String(draft.resolved_option_id)}
                      onChange={(event) => updateDraft(row.id, 'resolved_option_id', event.target.value)}
                    >
                      {options.length === 0 ? (
                        <option value="1">No options loaded</option>
                      ) : (
                        options.map((opt) => (
                          <option key={opt.id} value={String(opt.id)}>
                            {opt.name}
                          </option>
                        ))
                      )}
                    </Select>
                    {' '}
                    <Input
                      value={draft.resolution_evidence_url}
                      onChange={(event) => updateDraft(row.id, 'resolution_evidence_url', event.target.value)}
                      placeholder="Evidence URL"
                    />
                    {' '}
                    <Input
                      value={draft.resolution_note}
                      onChange={(event) => updateDraft(row.id, 'resolution_note', event.target.value)}
                      placeholder="Resolution note"
                    />
                    {' '}
                    <Button size="sm" onClick={() => onResolve(row.id, draft)}>
                      Resolve
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      </CardContent>
    </Card>
  );
};
