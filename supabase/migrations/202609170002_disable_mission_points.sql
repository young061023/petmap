-- Mission completion is now its own reward. Keep historical point balances for
-- data compatibility, but prevent clients from claiming any new point reward.
revoke execute on function public.claim_mission_reward(text) from authenticated;
