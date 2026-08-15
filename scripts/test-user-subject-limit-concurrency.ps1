param(
    [string]$ContainerName = "supabase_db_study-buddy-hub"
)

$ErrorActionPreference = "Stop"

$UserId = "00000000-0000-0000-0000-00000000c001"
$CustomIds = 1..8 | ForEach-Object {
    "70000000-0000-0000-0000-{0}" -f $_.ToString("000000000000")
}

$setupSql = @"
begin;
delete from auth.users where id = '$UserId';

insert into auth.users (
  id, email, aud, role, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '$UserId',
  'concurrency.subject.limit@example.test',
  'authenticated',
  'authenticated',
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}'::jsonb,
  now(), now()
);

insert into public.custom_subjects (id, user_id, name)
values
$(
    ($CustomIds | ForEach-Object -Begin { $i = 0 } -Process {
        $i++
        "('$_', '$UserId', 'Concurrent Subject $i')"
    }) -join ",`n"
);

insert into public.user_subjects (user_id, custom_subject_id)
select '$UserId', id
from public.custom_subjects
where user_id = '$UserId'
order by name
limit 6;
commit;
"@

$setupSql | docker exec -i $ContainerName `
    psql -U postgres -d postgres -v ON_ERROR_STOP=1 | Out-Host

$sqlA = "insert into public.user_subjects (user_id, custom_subject_id) values ('$UserId', '$($CustomIds[6])');"
$sqlB = "insert into public.user_subjects (user_id, custom_subject_id) values ('$UserId', '$($CustomIds[7])');"

$jobA = Start-Job -ArgumentList $ContainerName, $sqlA -ScriptBlock {
    param($Container, $Sql)

    $output = $Sql | docker exec -i $Container `
        psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1

    [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Output   = ($output -join "`n")
    }
}

$jobB = Start-Job -ArgumentList $ContainerName, $sqlB -ScriptBlock {
    param($Container, $Sql)

    $output = $Sql | docker exec -i $Container `
        psql -U postgres -d postgres -v ON_ERROR_STOP=1 2>&1

    [pscustomobject]@{
        ExitCode = $LASTEXITCODE
        Output   = ($output -join "`n")
    }
}

$jobs = @($jobA, $jobB)

Wait-Job $jobs | Out-Null
$results = $jobs | Receive-Job
$jobs | Remove-Job

$results | Format-List | Out-Host

$countSql = @"
select count(*)::integer
from public.user_subjects
where user_id = '$UserId'
  and deleted_at is null
  and is_archived = false;
"@

$countOutput = $countSql | docker exec -i $ContainerName `
    psql -U postgres -d postgres -t -A -v ON_ERROR_STOP=1

$activeCount = [int]($countOutput.Trim())
$successCount = @($results | Where-Object ExitCode -eq 0).Count
$failureCount = @($results | Where-Object ExitCode -ne 0).Count

Write-Host "Final active subject count: $activeCount"
Write-Host "Concurrent successes: $successCount"
Write-Host "Concurrent failures: $failureCount"

if ($activeCount -ne 7 -or $successCount -ne 1 -or $failureCount -ne 1) {
    throw "Concurrency test failed. Expected exactly 7 active subjects, one success, and one rejection."
}

Write-Host "PASS: advisory locking prevented the concurrent eighth active subject."
