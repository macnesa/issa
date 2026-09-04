import { tw } from "../../../shared/ui/tw";
import {
  Table,
  TableBody,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react/components/Table";
import { LedgerShell } from "../../../shared/ui/ui";
import TableScores from "./TableScores";

export default function ScoreHistory({ scores, student }) {
  const scoreRecords = Array.isArray(scores) ? scores : [];
  const showPredikat = scoreRecords.some((score) => Boolean(score.category));

  return (
    <LedgerShell
      className={tw("score-history-ledger")}
      eyebrow="Riwayat"
      title="Riwayat nilai"
      description="Status ditentukan berdasarkan KKM mata pelajaran."
      empty={scoreRecords.length === 0}
      emptyTitle="Belum ada nilai tercatat"
      emptyDescription="Catat penilaian pertama untuk membuka riwayat akademik siswa."
    >
      {scoreRecords.length > 0 && (
        <>
          <div className={tw("score-history-mobile-list border-y border-issa-border md:hidden")}>
            {scoreRecords.map((score, index) => (
              <TableScores
                key={`mobile-${score.id}`}
                data={score}
                student={student}
                recordIndex={index + 1}
                showPredikat={showPredikat}
                mobile
              />
            ))}
          </div>
          <div className={tw("score-history-desktop-table hidden overflow-x-auto md:block")}>
            <Table className={tw("score-history-ledger__table [min-width:58rem]")} hoverable>
              <TableHead>
                <TableRow>
                  <TableHeadCell>No.</TableHeadCell>
                  <TableHeadCell>Mata pelajaran</TableHeadCell>
                  <TableHeadCell>Penilaian</TableHeadCell>
                  <TableHeadCell>KKM</TableHeadCell>
                  <TableHeadCell>Nilai</TableHeadCell>
                  <TableHeadCell>Status</TableHeadCell>
                  {showPredikat && <TableHeadCell>Predikat</TableHeadCell>}
                  <TableHeadCell>Tanggal</TableHeadCell>
                  <TableHeadCell>Aksi</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {scoreRecords.map((score, index) => (
                  <TableScores
                    key={score.id}
                    data={score}
                    student={student}
                    recordIndex={index + 1}
                    showPredikat={showPredikat}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </LedgerShell>
  );
}
